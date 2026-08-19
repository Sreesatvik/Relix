from mcp_server.rag_store import search

def run_tests():
    print("--- Test 1: Machine Vibration Incident ---")
    results1 = search("machine vibration and tool wear before failure", doc_type="incident_report", top_k=3)
    for res in results1:
        print(f"doc_id: {res['doc_id']}, doc_type: {res['doc_type']}, distance: {res['distance']:.4f}")

    print("\n--- Test 2: Material Supplier Delay Playbook ---")
    results2 = search("what to do when a material supplier is delayed", doc_type="response_playbook", top_k=3)
    for res in results2:
        print(f"doc_id: {res['doc_id']}, doc_type: {res['doc_type']}, distance: {res['distance']:.4f}")

if __name__ == "__main__":
    run_tests()
