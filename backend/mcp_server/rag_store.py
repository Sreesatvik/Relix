"""
RAG Store Module

This module builds an in-memory vector store over the synthetic KNOWLEDGE_DOCS
and exposes a search() function for retrieving relevant documents based on
semantic similarity.
"""

import chromadb
from sentence_transformers import SentenceTransformer
from backend.data.knowledge_docs import KNOWLEDGE_DOCS

# 1. Load the embedding model
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# 2. Create an in-memory Chroma client and collection
chroma_client = chromadb.Client()
collection = chroma_client.create_collection(name="knowledge_base")

def build_index():
    """
    Iterates over KNOWLEDGE_DOCS, embeds each document's text, 
    and adds it to the Chroma collection with its metadata.
    """
    if not KNOWLEDGE_DOCS:
        return
        
    texts = []
    embeddings = []
    metadatas = []
    ids = []
    
    for doc in KNOWLEDGE_DOCS:
        text = doc["text"]
        
        # Build metadata, omitting None values to avoid ChromaDB errors
        meta = {"doc_type": doc["doc_type"]}
        if doc.get("line_id") is not None:
            meta["line_id"] = doc["line_id"]
        if doc.get("entity_id") is not None:
            meta["entity_id"] = doc["entity_id"]
            
        texts.append(text)
        embeddings.append(embedder.encode(text).tolist())
        metadatas.append(meta)
        ids.append(doc["doc_id"])
        
    collection.add(
        documents=texts,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=ids
    )

def search(query: str, doc_type: str = None, top_k: int = 5) -> list[dict]:
    """
    Search the RAG store for documents similar to the query.
    Optionally filter by doc_type.
    """
    query_embedding = embedder.encode(query).tolist()
    
    where_clause = None
    if doc_type:
        where_clause = {"doc_type": doc_type}
        
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where=where_clause,
        include=["documents", "metadatas", "distances"]
    )
    
    formatted_results = []
    
    if not results["ids"] or not results["ids"][0]:
        return formatted_results
        
    # Chroma returns lists of lists since you can query multiple embeddings at once
    ids = results["ids"][0]
    docs = results["documents"][0]
    metas = results["metadatas"][0]
    distances = results["distances"][0]
    
    for i in range(len(ids)):
        meta = metas[i]
        formatted_results.append({
            "doc_id": ids[i],
            "doc_type": meta.get("doc_type"),
            "line_id": meta.get("line_id"),
            "entity_id": meta.get("entity_id"),
            "text": docs[i],
            "distance": distances[i]
        })
        
    return formatted_results

# 4. Call build_index() once at module load time
build_index()

