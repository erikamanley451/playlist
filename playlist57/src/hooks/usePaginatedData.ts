import { useState, useEffect, useCallback } from "react";

// Generic hook for paginated data fetching
const usePaginatedData = (fetchFunction: Function, limit: number = 50) => {
  const [data, setData] = useState<any[]>([]);
  const [offset, setOffset] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { tracks, total } = await fetchFunction(0, limit);
      setData(tracks);
      setTotal(total);
      setOffset(limit);
    };
    fetchInitialData();
  }, [fetchFunction]);

  // Function to load more data when scrolling
  const fetchData = useCallback(async () => {
    if (!hasMore || isFetchingMore) return;
    setIsFetchingMore(true);
    try {
      const { tracks: newData } = await fetchFunction(offset, limit);
      if (newData.length > 0) {
        setData(prev => [...prev, ...newData]);
        setOffset(prev => prev + limit);
        if (offset + limit >= total) setHasMore(false);
      } else {
        setHasMore(false);
      }
    } finally {
      setIsFetchingMore(false);
    }
  }, [offset, hasMore, isFetchingMore, fetchFunction]);

  return { data, isFetchingMore, hasMore, fetchData };
};

export default usePaginatedData;
