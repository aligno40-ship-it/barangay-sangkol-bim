import { Resident } from '../types';

export const uniqueResidentsById = (residents: Resident[]): Resident[] => {
  const seenResidentIds = new Set<string>();
  return residents.filter((resident) => {
    if (!resident.id || seenResidentIds.has(resident.id)) return false;
    seenResidentIds.add(resident.id);
    return true;
  });
};
