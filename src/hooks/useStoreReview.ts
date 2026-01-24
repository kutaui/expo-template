import * as StoreReview from "expo-store-review";

export const requestStoreReview = async () => {
    try {
        const isAvailable = await StoreReview.isAvailableAsync();
        const hasAction = await StoreReview.hasAction();

        if (isAvailable && hasAction) {
            await StoreReview.requestReview();
        }
    } catch (error) {
        console.error(error);
    }
};