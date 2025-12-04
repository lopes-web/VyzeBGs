
const REPLICATE_API_KEY_STORAGE_KEY = 'replicate_api_key';

export const saveReplicateKey = (key: string) => {
    localStorage.setItem(REPLICATE_API_KEY_STORAGE_KEY, key);
};

export const getReplicateKey = (): string | null => {
    return localStorage.getItem(REPLICATE_API_KEY_STORAGE_KEY);
};

export const checkReplicateKey = (): boolean => {
    return !!getReplicateKey();
};

export const removeBackground = async (imageUrl: string, apiKey: string): Promise<string> => {
    // 1. Start the prediction via Proxy
    const startResponse = await fetch("/api/remove-bg", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            action: 'start',
            apiKey,
            imageUrl
        }),
    });

    if (!startResponse.ok) {
        const error = await startResponse.json();
        throw new Error(error.detail || error.error || "Failed to start background removal");
    }

    const prediction = await startResponse.json();
    let predictionId = prediction.id;
    let status = prediction.status;

    // 2. Poll for results via Proxy
    while (status !== "succeeded" && status !== "failed" && status !== "canceled") {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s

        const pollResponse = await fetch("/api/remove-bg", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                action: 'check',
                apiKey,
                predictionId
            }),
        });

        if (!pollResponse.ok) {
            throw new Error("Failed to poll prediction status");
        }

        const updatedPrediction = await pollResponse.json();
        status = updatedPrediction.status;

        if (status === "succeeded") {
            return updatedPrediction.output;
        } else if (status === "failed" || status === "canceled") {
            throw new Error("Background removal failed or was canceled");
        }
    }

    throw new Error("Unexpected error during background removal");
};
