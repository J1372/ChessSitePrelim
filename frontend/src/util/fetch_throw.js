
// Simple throwing fetch wrapper (if not res.ok) for use with React Query.
export const fetchThrow = async (url, init=undefined) => {
    return fetch(url, init).then(res => {
        if (res.ok) {
            return res;
        } else {
            throw new Error(res.statusText);
        }
    });
}
