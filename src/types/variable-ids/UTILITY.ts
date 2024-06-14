export enum UTILITY {
  admin_date = "82a2ca5f-2025-4454-894d-495c362ae0d7",
  checkbox_with_action = "90ad2335-003f-4cfa-a8db-15ddbb0372ab",
}

export const UTILITY_PREFIX = "bc3d85f0-5044-4ee8-9470-df5520c2574c:undefined";

export const getUtilityId = (utilityId: UTILITY) => `${UTILITY_PREFIX}:${utilityId}`;