import { atom } from 'jotai';

export const isLoggedInAtom = atom(false);
export const emailAtom = atom<string | null>(null);
export const nicknameAtom = atom('학부생');
export const profileImageAtom = atom<string | null>(null);
