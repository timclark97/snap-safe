import { createContext, useContext, ReactNode } from "react";

type SelfContextType = {
  id: string;
  firstName: string;
  lastName: string;
};

const SelfContext = createContext<SelfContextType>({} as SelfContextType);

export const useSelf = () => useContext(SelfContext);

export function SelfContextProvider({
  user,
  children
}: {
  user: SelfContextType;
  children: ReactNode;
}) {
  return <SelfContext.Provider value={user}>{children}</SelfContext.Provider>;
}
