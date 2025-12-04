
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
    // 1. Start the prediction
    const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
            "Authorization": `Token ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            version: "a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc", // 851-labs/background-remover
            input: {
                image: imageUrl,
                format: "png",
                background_type: "rgba"
            },
        }),
    });

    if (!startResponse.ok) {
        const error = await startResponse.json();
        throw new Error(error.detail || "Failed to start background removal");
    }

    const prediction = await startResponse.json();
    let predictionId = prediction.id;
    let status = prediction.status;

    // 2. Poll for results
    while (status !== "succeeded" && status !== "failed" && status !== "canceled") {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s

        const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
            headers: {
                "Authorization": `Token ${apiKey}`,
                "Content-Type": "application/json",
            },
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
