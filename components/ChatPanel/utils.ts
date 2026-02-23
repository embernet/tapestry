
export const parseParameters = (params: any) => {
    if (typeof params === 'string') {
        try {
            return JSON.parse(params);
        } catch (e) {
            console.warn("Failed to parse tool parameters JSON:", params);
            return {};
        }
    }
    return params || {};
};
