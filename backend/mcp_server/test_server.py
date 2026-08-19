import asyncio
import json
import datetime
from backend.mcp_server.server import (
    get_domain_status,
    get_signal_history,
    search_knowledge_base,
    get_business_context
)

# Custom JSON encoder to handle datetime objects returned by pydantic
class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime.datetime):
            return obj.isoformat()
        return super().default(obj)

async def run_tests():
    print("========================================")
    print("TEST 1: get_domain_status")
    print("========================================")
    status_result = await get_domain_status("machine", entity_id="M17", line_id="LINE-4")
    print(json.dumps(status_result, indent=2, cls=DateTimeEncoder))

    print("\n========================================")
    print("TEST 2: get_signal_history")
    print("========================================")
    history_result = await get_signal_history("M17", "machine", hours=72)
    print(json.dumps(history_result, indent=2, cls=DateTimeEncoder))

    print("\n========================================")
    print("TEST 3: search_knowledge_base")
    print("========================================")
    search_result = await search_knowledge_base("bearing failure response", doc_type="sop")
    print(json.dumps(search_result, indent=2, cls=DateTimeEncoder))

    print("\n========================================")
    print("TEST 4: get_business_context")
    print("========================================")
    context_result = await get_business_context("LINE-4")
    print(json.dumps(context_result, indent=2, cls=DateTimeEncoder))

if __name__ == "__main__":
    asyncio.run(run_tests())
