import { Route } from "wouter";
import { Home } from "@/pages/home";

export function App() {
  return (
    <>
      <Route path="/">
        <Home />
      </Route>
    </>
  );
}
