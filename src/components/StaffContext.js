'use client';
import { createContext, useContext } from 'react';

export const StaffContext = createContext({ profile: null });
export const useStaff = () => useContext(StaffContext);
