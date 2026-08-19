import pytest
import asyncio
from mcp_server.rag_store import search
from mcp_server.server import get_domain_status, get_signal_history, search_knowledge_base, get_business_context

@pytest.mark.asyncio
async def test_rag_retrieval_and_filtering():
    """Test RAG retrieval works and doc_type filtering accurately filters out invalid types."""
    # Test single doc_type filtering
    results_incident = await search_knowledge_base("anomaly on line", doc_type="incident_report")
    for r in results_incident:
        assert r["doc_type"] == "incident_report"

    # Test multiple doc_type filtering (list)
    results_multi = await search_knowledge_base("failure", doc_type=["sop", "root_cause_analysis"])
    for r in results_multi:
        assert r["doc_type"] in ["sop", "root_cause_analysis"]

@pytest.mark.asyncio
async def test_empty_retrieval():
    """Test that missing documents/empty retrieval states are safely handled."""
    # A highly improbable string to ensure no docs match
    results = await search_knowledge_base("xyz123highlyimprobablequerythatwillnotmatchanything", doc_type="sop")
    # Even if top_k returns nearest vectors, we can verify it doesn't crash
    assert isinstance(results, list)
    
    # Let's test a non-existent doc_type
    results_invalid_type = await search_knowledge_base("test", doc_type="non_existent_type")
    assert len(results_invalid_type) == 0

@pytest.mark.asyncio
async def test_mcp_tools_domain_status():
    """Test get_domain_status handles valid and invalid domains/entities."""
    # Valid domain
    res = await get_domain_status("machine", line_id="LINE-4")
    assert res["domain"] == "machine"
    assert "signals" in res
    
    # Invalid domain
    res_invalid = await get_domain_status("invalid_domain", line_id="LINE-4")
    assert res_invalid["error"] == "Domain 'invalid_domain' not found."
    assert res_invalid["signals"] == []

    # Invalid entity
    res_invalid_entity = await get_domain_status("machine", entity_id="NON_EXISTENT_ENTITY")
    assert len(res_invalid_entity["signals"]) == 0

@pytest.mark.asyncio
async def test_mcp_tools_signal_history():
    """Test get_signal_history works properly and handles invalid inputs."""
    # Valid
    res = await get_signal_history(entity_id="M17", domain="machine")
    assert isinstance(res, list)

    # Invalid domain
    res_invalid = await get_signal_history(entity_id="M17", domain="invalid_domain")
    assert len(res_invalid) == 0

    # Invalid entity
    res_invalid_ent = await get_signal_history(entity_id="NON_EXISTENT", domain="machine")
    assert len(res_invalid_ent) == 0

@pytest.mark.asyncio
async def test_mcp_tools_business_context():
    """Test business context retrieval."""
    res = await get_business_context("LINE-4")
    assert isinstance(res, dict)
    
    # Missing line
    res_missing = await get_business_context("LINE-999")
    assert res_missing == {}

@pytest.mark.asyncio
async def test_agent_tool_failures():
    """Test that agent tools gracefully handle tool failures by passing bad inputs."""
    try:
        # Invalid query parameters should not crash the system, but might return empty/errors
        res = await asyncio.gather(
            get_domain_status("bad_domain"),
            get_signal_history("bad_entity", "bad_domain"),
            search_knowledge_base("", doc_type="bad_type")
        )
        assert res[0]["error"] == "Domain 'bad_domain' not found."
        assert len(res[1]) == 0
        assert len(res[2]) == 0
    except Exception as e:
        pytest.fail(f"Agent tools crashed on invalid inputs: {e}")
