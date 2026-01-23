import json
import os
import re
import hashlib
import time
import traceback
import logging
from datetime import datetime, date, timezone, timedelta
from zoneinfo import ZoneInfo
from concurrent.futures import ThreadPoolExecutor

import boto3
from botocore.exceptions import ClientError
from openai import OpenAI

logger = logging.getLogger()
logger.setLevel(logging.INFO)


# 음력 변환 패키지 (Layer로 추가되어 있어야 함 - 추가 완료)
try:
    from korean_lunar_calendar import KoreanLunarCalendar
except Exception:
    KoreanLunarCalendar = None


# -----------------------------
# Globals
# -----------------------------
dynamodb = boto3.resource("dynamodb")
TABLE_NAME = os.environ["TABLE_NAME"]
table = dynamodb.Table(TABLE_NAME)

# OpenAI Client (타임아웃 30초 설정)
_OPENAI_CLIENT = OpenAI(
    api_key=os.environ["OPENAI_API_KEY"],
    timeout=30.0  # 30초 타임아웃
)

KST = ZoneInfo("Asia/Seoul")
YMD = re.compile(r"^\d{4}-\d{2}-\d{2}$")
DAY_ENUM = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
ACTION_CATEGORIES = [
    "정리정돈", "인간관계", "커리어정리", "학습/자기계발", "금전점검", "가벼운도전",
    "감사/친절", "건강관리", "집중력회복", "취미/창작", "소통/표현", "생활관리"
]

# -----------------------------
# Response helpers (BaseResponse)
# -----------------------------
def _resp(status_code: int, body: dict):
    return {
        "statusCode": status_code,
        "headers": {"content-type": "application/json; charset=utf-8"},
        "body": json.dumps(body, ensure_ascii=False),
    }


def _success(result: dict | None, code: int = 200, message: str = "요청에 성공하였습니다."):
    body = {"isSuccess": True, "code": code, "message": message}
    if result is not None:
        body["result"] = result
    return _resp(code, body)


def _error(code: int, message: str):
    return _resp(code, {"isSuccess": False, "code": code, "message": message})


# -----------------------------
# Auth / Date helpers
# -----------------------------
def _get_sub(event) -> str | None:
    try:
        return event["requestContext"]["authorizer"]["jwt"]["claims"]["sub"]
    except Exception:
        return None


def _today_kst() -> date:
    return datetime.now(tz=KST).date()


def _weekday_enum(d: date) -> str:
    return DAY_ENUM[d.weekday()]  # Monday=0 ... Sunday=6


def _to_lunar_ymd(solar: date) -> str:
    if KoreanLunarCalendar is None:
        raise RuntimeError("lunar library not installed")

    cal = KoreanLunarCalendar()
    cal.setSolarDate(solar.year, solar.month, solar.day)
    return cal.LunarIsoFormat()  # "YYYY-MM-DD"


def _hash_user_identifier(sub: str) -> str:
    # OpenAI safety_identifier 권장: PII 대신 해시 사용
    return hashlib.sha256(sub.encode("utf-8")).hexdigest()


def pick_action_category(user_sub: str, solar_ymd: str) -> str:
    seed = f"{user_sub}|{solar_ymd}".encode("utf-8")
    h = int(hashlib.sha256(seed).hexdigest(), 16)
    return ACTION_CATEGORIES[h % len(ACTION_CATEGORIES)]

# -----------------------------
# GPT helpers
# -----------------------------
def _generate_fortune(
    solar_ymd: str,
    lunar_ymd: str,
    day: str,
    profile: dict | None,
    user_sub: str,
    previous_fortune: dict | None = None,
) -> dict:
    """
    OpenAI GPT로 운세 생성
    반환 dict keys:
      summary, money, love, success, recommendedAction
    """
    model = os.getenv("OPENAI_MODEL", "gpt-5-mini")
    # temperature = float(os.getenv("OPENAI_TEMPERATURE", "0.85"))  # 다양성을 위해 높임
    max_out = int(os.getenv("OPENAI_MAX_OUTPUT_TOKENS", "800"))  # 800~1200 범위

    profile = profile or {}

    system = (
        "당신은 한국어로 현실적이고 정성스러운 '오늘의 운세' 문구를 생성합니다.\n"
        "출력은 반드시 JSON 한 개만 반환합니다(설명/머리말/코드블록/추가 텍스트 금지).\n"
        "\n"
        "[안전/톤]\n"
        "- 과도한 공포 조장 금지.\n"
        "- 따뜻하고 공손한 말투를 사용하여 정성스러운 느낌을 전달합니다.\n"
        "\n"
        "[다양성/창의성]\n"
        "- 매일 다른 관점과 내용으로 운세를 작성합니다. 반복적이거나 비슷한 표현을 피하세요.\n"
        "- 날짜, 요일, 음력 정보를 활용하여 그 날만의 고유한 운세를 만들어내세요.\n"
        "- 다양한 상황, 감정, 조언을 포함하여 매일 다른 운세가 나오도록 하세요.\n"
        "- 같은 카테고리(금전, 연애, 성공)라도 매일 다른 각도와 표현으로 작성하세요.\n"
        "\n"
        "[문체/말투]\n"
        "- 반드시 공손하고 정중한 말투를 사용합니다.\n"
        "- '~입니다', '~하시기 바랍니다', '~하시면 좋겠습니다', '~하시는 것이 좋겠습니다' 등의 공손한 표현을 적극 활용합니다.\n"
        "- '~다', '~해라', '~하자' 같은 평서문이나 명령형은 사용하지 않습니다.\n"
        "- '~할 수 있습니다', '~될 수 있습니다', '~하시면 됩니다' 같은 부드러운 조언형 표현을 사용합니다.\n"
        "- 따뜻하고 배려하는 톤으로 작성하여 읽는 이에게 위로와 격려를 전달합니다.\n"
        "\n"
        "[형식]\n"
        "- 각 필드 값은 줄바꿈 없는 '한 줄 문자열'입니다.\n"
        "- 모든 문장은 반드시 '.'로 끝납니다.\n"
        "- 문장과 문장 사이는 공백 한 칸으로만 구분합니다.\n"
        "- 모든 문장은 공손한 말투('~입니다', '~하시기 바랍니다' 등)로 통일합니다.\n"
        "\n"
        "[문장 수]\n"
        "- summary: 정확히 4문장\n"
        "- money/love/success/recommendedAction: 각각 정확히 2문장\n"
        "\n"
        "[summary 첫 문장 길이]\n"
        "- summary의 첫 문장만 공백 포함 28자 이내('.' 포함)로 작성합니다.\n"
        "- 따옴표(\")는 글자 수 계산에서 제외합니다.\n"
        "- summary에 사용자 이름을 포함하지 않습니다.\n"
        "- summary에 날짜(예: '2026년 1월 8일', '오늘', '이 날' 등)를 직접 언급하지 않습니다.\n"
    )

    # 날짜 기반 다양성 요소 생성
    day_num = int(solar_ymd.split("-")[2])  # 일자 추출
    month_num = int(solar_ymd.split("-")[1])  # 월 추출
    
    user_content = (
        f"다음 정보를 바탕으로 정성스럽고 공손한 말투의 운세를 생성하세요.\n"
        f"양력: {solar_ymd} (월: {month_num}, 일: {day_num})\n"
        f"음력: {lunar_ymd}\n"
        f"요일: {day}\n"
        f"성별(M/F): {profile.get('gender')}\n"
        f"출생일시: {profile.get('birthDateTime')}\n"
        "\n"
        "중요 요구사항:\n"
        f"- 이 날짜만의 고유하고 특별한 운세를 작성하세요. 다른 날짜와 비슷한 내용이 되지 않도록 주의하세요.\n"
        "- 날짜, 요일, 월, 일자 등의 정보를 활용하여 그 날만의 의미 있는 운세를 만들어내되, summary에는 날짜를 직접 언급하지 마세요.\n"
        "- summary에는 '2026년 1월 8일', '오늘', '이 날', '목요일인 오늘', '오늘의 운' 등 날짜나 요일, 운을 직접 언급하는 표현을 사용하지 마세요.\n"
        "- summary는 날짜 언급 없이 순수하게 운세 내용만 전달하세요.\n"
        "- 매일 다른 관점, 다른 상황, 다른 조언을 포함하여 다양성을 확보하세요.\n"
        "- 5개 항목(summary, money, love, success, recommendedAction)을 모두 채우되, 각 항목마다 매일 다른 내용으로 작성하세요.\n"
        "- recommendedAction에는 '오늘 당장 할 수 있는 구체 행동 1개'를 반드시 포함하되, 날짜나 상황에 맞는 고유한 행동을 제안하세요.\n"
        "- 모든 문장은 공손한 말투('~입니다', '~하시기 바랍니다' 등)로 작성하세요.\n"
        "- 따뜻하고 정성스러운 표현을 사용하여 읽는 이에게 위로와 격려를 전달하세요.\n"
        "- 모든 문장은 '.'로 끝나야 합니다.\n"
    )

    action_cat = pick_action_category(user_sub, solar_ymd)

    user_content += (
        "\n[추천행동 다양성 규칙]\n"
        f"- recommendedAction은 반드시 '{action_cat}' 카테고리의 행동으로만 작성하세요.\n"
        "- 명상/산책/호흡/스트레칭/물마시기/일찍자기 같은 포괄적 자기관리 문구는 금지합니다.\n"
        "- 매우 구체 행동 1개를 포함해야 합니다(대상/도구/장소/시간 중 2개 이상 명시).\n"
    )

    
    # 이전/다음 운세 정보 추가
    if previous_fortune:
        previous_fortune_text = (
            "\n"
            "[참고: 다른 날의 운세]\n"
            f"다른 날 운세의 summary: {previous_fortune.get('summary', '')}\n"
            f"다른 날 운세의 money: {previous_fortune.get('money', '')}\n"
            f"다른 날 운세의 love: {previous_fortune.get('love', '')}\n"
            f"다른 날 운세의 success: {previous_fortune.get('success', '')}\n"
            f"다른 날 운세의 recommendedAction: {previous_fortune.get('recommendedAction', '')}\n"
            "\n"
            " 매우 중요: 위의 다른 날 운세와 완전히 다른 내용, 다른 표현, 다른 관점으로 오늘의 운세를 작성하세요.\n"
            "- 다른 날과 비슷한 문구나 표현을 절대 사용하지 마세요.\n"
            "- 다른 날과 다른 상황, 다른 조언으로 작성하세요.\n"
            "- 각 항목(summary, money, love, success, recommendedAction) 모두 다른 날과 확실히 구분되도록 작성하세요.\n"
        )
        user_content = user_content + previous_fortune_text


    # Structured Outputs (JSON Schema)
    schema = {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "summary": {"type": "string"},
            "money": {"type": "string"},
            "love": {"type": "string"},
            "success": {"type": "string"},
            "recommendedAction": {"type": "string"},
        },
        "required": ["summary", "money", "love", "success", "recommendedAction"],
    }

    api_call_start = time.time()
    try:
        req = dict(
            model=model,  # gpt-5-mini
            input=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_content},
            ],
            max_output_tokens=max_out,
            text={
                "format": {
                    "type": "json_schema",
                    "name": "fortune_response",
                    "schema": schema,
                },
                # 선택: "verbosity": "low" | "medium" | "high"
            },
            reasoning={"effort": "minimal"}
        )

        resp = _OPENAI_CLIENT.responses.parse(**req)

        api_call_time = time.time() - api_call_start

        # 성능 및 usage 로그
        usage = getattr(resp, "usage", None)
        logger.info(json.dumps({
            "metric": "openai_api_call_done",
            "duration_ms": round(api_call_time * 1000, 2),
            "input_tokens": getattr(usage, "input_tokens", None) if usage else None,
            "output_tokens": getattr(usage, "output_tokens", None) if usage else None,
            "total_tokens": getattr(usage, "total_tokens", None) if usage else None
        }, ensure_ascii=False))
        
    except Exception as e:
        api_call_time = time.time() - api_call_start
        error_type = type(e).__name__
        error_msg = str(e)
        
        logger.error(json.dumps({
            "metric": "openai_api_call_error",
            "duration_ms": round(api_call_time * 1000, 2),
            "error_type": error_type,
            "error_msg": error_msg
        }, ensure_ascii=False))
        raise

    # 응답에서 텍스트 추출
    try:
        raw = getattr(resp, "output_text", None)
        source = "resp.output_text"
        
        raw = raw.strip() if raw and isinstance(raw, str) else ""
        
        if raw:
            logger.info(json.dumps({
                "metric": "openai_response_found",
                "date": solar_ymd,
                "source": source,
                "length": len(raw)
            }, ensure_ascii=False))

        if not raw:
            # status, incomplete_details, output_types 로그
            status = getattr(resp, "status", None)
            incomplete_details = str(getattr(resp, "incomplete_details", None)) if hasattr(resp, "incomplete_details") else None
            
            output_types = []
            if hasattr(resp, "output") and isinstance(getattr(resp, "output"), (list, tuple)):
                for item in getattr(resp, "output"):
                    item_type = getattr(item, "type", None)
                    if item_type:
                        output_types.append(item_type)
            
            logger.error(json.dumps({
                "metric": "openai_response_empty",
                "date": solar_ymd,
                "status": status,
                "incomplete_details": incomplete_details,
                "output_types": output_types
            }, ensure_ascii=False))
            raise RuntimeError("LLM output empty")

        # JSON 파싱
        if not (raw.startswith("{") and raw.endswith("}")):
            logger.error(json.dumps({
                "metric": "openai_response_not_json",
                "date": solar_ymd,
                "raw_preview": raw[:200]
            }, ensure_ascii=False))
            raise RuntimeError(f"LLM output is not valid JSON. Raw preview: {raw[:200]}")
        
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        logger.error(json.dumps({
            "metric": "openai_response_json_error",
            "date": solar_ymd,
            "error_type": type(e).__name__,
            "error_msg": str(e),
            "raw_preview": raw[:200] if raw else "empty"
        }, ensure_ascii=False))
        raise RuntimeError(f"Failed to parse LLM output as JSON: {str(e)}. Raw preview: {raw[:200] if raw else 'empty'}")
    except Exception as e:
        logger.error(json.dumps({
            "metric": "openai_response_parse_error",
            "date": solar_ymd,
            "error_type": type(e).__name__,
            "error_msg": str(e)
        }, ensure_ascii=False))
        raise

    # 스키마 검증
    required = ["summary", "money", "love", "success", "recommendedAction"]
    if (
        not isinstance(data, dict)
        or not all(k in data and isinstance(data[k], str) and data[k].strip() for k in required)
    ):
        missing_keys = [k for k in required if k not in data] if isinstance(data, dict) else required
        empty_keys = [k for k in required if k in data and (not isinstance(data[k], str) or not data[k].strip())] if isinstance(data, dict) else []
        logger.error(json.dumps({
            "metric": "openai_schema_validation_failed",
            "date": solar_ymd,
            "missing_keys": missing_keys,
            "empty_keys": empty_keys
        }, ensure_ascii=False))
        raise RuntimeError("LLM output schema invalid")

    return {k: data[k].strip() for k in required}


# -----------------------------
# Lambda handler
# -----------------------------
def lambda_handler(event, context):
    start_time = time.time()
    request_id = context.aws_request_id if context else "unknown"
    
    try:
        user_sub = _get_sub(event)
        if not user_sub:
            return _error(401, "인증에 실패하였습니다.")

        path_params = event.get("pathParameters") or {}
        solar_ymd = path_params.get("date")

        if not solar_ymd or not isinstance(solar_ymd, str) or not YMD.match(solar_ymd):
            return _error(400, "date는 YYYY-MM-DD 형식이어야 합니다.")

        try:
            solar_date = datetime.strptime(solar_ymd, "%Y-%m-%d").date()
        except Exception:
            return _error(400, "date는 YYYY-MM-DD 형식이어야 합니다.")

        if solar_date.year != 2026:
            return _error(400, "2026년 데이터만 조회할 수 있습니다.")

        if solar_date > _today_kst():
            return _error(403, "미래 날짜의 운세는 조회할 수 없습니다.")

        pk = f"USER#{user_sub}"
        sk = f"FORTUNE#{solar_ymd}"

        # 1) DB 조회
        try:
            got = table.get_item(Key={"pk": pk, "sk": sk}).get("Item")
        except Exception as e:
            logger.error(json.dumps({
                "metric": "db_query_error",
                "request_id": request_id,
                "error_type": type(e).__name__,
                "error_msg": str(e)
            }, ensure_ascii=False))
            return _error(500, "서버 오류가 발생하였습니다.")

        if got:
            try:
                fortune = {
                    "solarDate": got["solarDate"],
                    "lunarDate": got["lunarDate"],
                    "day": got["day"],
                    "summary": got["summary"],
                    "money": got["money"],
                    "love": got["love"],
                    "success": got["success"],
                    "recommendedAction": got["recommendedAction"],
                }
                
                return _success({"fortune": fortune, "source": "db"})
            except KeyError as e:
                logger.error(json.dumps({
                    "metric": "db_item_missing_key",
                    "request_id": request_id,
                    "missing_key": str(e)
                }, ensure_ascii=False))
                return _error(500, "서버 오류가 발생하였습니다.")

        # 2) 없으면 생성
        try:
            lunar_ymd = _to_lunar_ymd(solar_date)
        except Exception as e:
            logger.error(json.dumps({
                "metric": "lunar_convert_error",
                "request_id": request_id,
                "error_type": type(e).__name__,
                "error_msg": str(e)
            }, ensure_ascii=False))
            return _error(500, "서버 오류가 발생하였습니다.")

        day = _weekday_enum(solar_date)

        # 이전/다음 운세 조회와 프로필 조회를 병렬로 실행
        parallel_start = time.time()
        previous_fortune = None
        profile = None
        
        def fetch_previous_fortune():
            """이전 운세 조회 (1순위: 어제, 2순위: 내일)"""
            try:
                # 1순위: 어제 운세 조회
                yesterday_date = solar_date - timedelta(days=1)
                yesterday_ymd = yesterday_date.strftime("%Y-%m-%d")
                yesterday_sk = f"FORTUNE#{yesterday_ymd}"
                
                yesterday_item = table.get_item(Key={"pk": pk, "sk": yesterday_sk}).get("Item")
                if yesterday_item:
                    return {
                        "summary": yesterday_item.get("summary"),
                        "money": yesterday_item.get("money"),
                        "love": yesterday_item.get("love"),
                        "success": yesterday_item.get("success"),
                        "recommendedAction": yesterday_item.get("recommendedAction"),
                    }
                
                # 2순위: 내일 운세 조회
                tomorrow_date = solar_date + timedelta(days=1)
                tomorrow_ymd = tomorrow_date.strftime("%Y-%m-%d")
                tomorrow_sk = f"FORTUNE#{tomorrow_ymd}"
                
                tomorrow_item = table.get_item(Key={"pk": pk, "sk": tomorrow_sk}).get("Item")
                if tomorrow_item:
                    return {
                        "summary": tomorrow_item.get("summary"),
                        "money": tomorrow_item.get("money"),
                        "love": tomorrow_item.get("love"),
                        "success": tomorrow_item.get("success"),
                        "recommendedAction": tomorrow_item.get("recommendedAction"),
                    }
                
                return None
            except Exception:
                return None
        
        def fetch_profile():
            """프로필 조회"""
            try:
                profile_item = table.get_item(Key={"pk": pk, "sk": "PROFILE"}).get("Item")
                if profile_item:
                    return {
                        "name": profile_item.get("name"),
                        "gender": profile_item.get("gender"),
                        "birthDateTime": profile_item.get("birthDateTime"),
                    }
                return None
            except Exception:
                return None
        
        # 병렬 실행
        with ThreadPoolExecutor(max_workers=2) as executor:
            future_prev = executor.submit(fetch_previous_fortune)
            future_profile = executor.submit(fetch_profile)
            
            previous_fortune = future_prev.result()
            profile = future_profile.result()

        # GPT 생성
        gpt_start = time.time()
        try:
            content = _generate_fortune(
                solar_ymd=solar_ymd,
                lunar_ymd=lunar_ymd,
                day=day,
                profile=profile,
                user_sub=user_sub,
                previous_fortune=previous_fortune,
            )
            
            gpt_time = time.time() - gpt_start
            logger.info(json.dumps({
                "metric": "gpt_generation_done",
                "request_id": request_id,
                "duration_ms": round(gpt_time * 1000, 2)
            }, ensure_ascii=False))
        except Exception as e:
            gpt_time = time.time() - gpt_start
            logger.error(json.dumps({
                "metric": "gpt_generation_error",
                "request_id": request_id,
                "duration_ms": round(gpt_time * 1000, 2),
                "error_type": type(e).__name__,
                "error_msg": str(e)
            }, ensure_ascii=False))
            return _error(500, "서버 오류가 발생하였습니다.")

        item = {
            "pk": pk,
            "sk": sk,
            "solarDate": solar_ymd,
            "lunarDate": lunar_ymd,
            "day": day,
            "summary": content["summary"],
            "money": content["money"],
            "love": content["love"],
            "success": content["success"],
            "recommendedAction": content["recommendedAction"],
            "createdAt": datetime.now(timezone.utc).isoformat(),
        }

        # 3) 조건부 Put(중복 생성 방지)
        try:
            table.put_item(
                Item=item,
                ConditionExpression="attribute_not_exists(pk) AND attribute_not_exists(sk)",
            )
            
            fortune = {
                "solarDate": solar_ymd,
                "lunarDate": lunar_ymd,
                "day": day,
                "summary": content["summary"],
                "money": content["money"],
                "love": content["love"],
                "success": content["success"],
                "recommendedAction": content["recommendedAction"],
            }
            
            total_time = time.time() - start_time
            logger.info(json.dumps({
                "metric": "lambda_success",
                "request_id": request_id,
                "source": "generated",
                "total_duration_ms": round(total_time * 1000, 2)
            }, ensure_ascii=False))
            
            return _success({"fortune": fortune, "source": "generated"})

        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code")
            
            if error_code != "ConditionalCheckFailedException":
                logger.error(json.dumps({
                    "metric": "db_save_error",
                    "request_id": request_id,
                    "error_type": type(e).__name__,
                    "error_code": error_code,
                    "error_msg": str(e)
                }, ensure_ascii=False))
                return _error(500, "서버 오류가 발생하였습니다.")

            # 누군가 먼저 생성했으면 재조회해서 db로 반환
            try:
                got2 = table.get_item(Key={"pk": pk, "sk": sk}).get("Item")
                
                if not got2:
                    logger.error(json.dumps({
                        "metric": "db_retry_query_empty",
                        "request_id": request_id
                    }, ensure_ascii=False))
                    return _error(500, "서버 오류가 발생하였습니다.")

                fortune = {
                    "solarDate": got2["solarDate"],
                    "lunarDate": got2["lunarDate"],
                    "day": got2["day"],
                    "summary": got2["summary"],
                    "money": got2["money"],
                    "love": got2["love"],
                    "success": got2["success"],
                    "recommendedAction": got2["recommendedAction"],
                }
                
                total_time = time.time() - start_time
                logger.info(json.dumps({
                    "metric": "lambda_success",
                    "request_id": request_id,
                    "source": "db_after_retry",
                    "total_duration_ms": round(total_time * 1000, 2)
                }, ensure_ascii=False))
                
                return _success({"fortune": fortune, "source": "db"})
            except Exception as e:
                logger.error(json.dumps({
                    "metric": "db_retry_query_error",
                    "request_id": request_id,
                    "error_type": type(e).__name__,
                    "error_msg": str(e)
                }, ensure_ascii=False))
                return _error(500, "서버 오류가 발생하였습니다.")
    
    except Exception as e:
        total_time = time.time() - start_time
        logger.error(json.dumps({
            "metric": "lambda_unexpected_error",
            "request_id": request_id,
            "total_duration_ms": round(total_time * 1000, 2),
            "error_type": type(e).__name__,
            "error_msg": str(e)
        }, ensure_ascii=False))
        return _error(500, "서버 오류가 발생하였습니다.")
