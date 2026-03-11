
export async function sendResponse(res, status, data) {
    res.status(status).json(data);
}

export async function sendError(res, status, error) {
    res.status(status).json({ error: error.message });
}