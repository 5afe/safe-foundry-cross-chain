'use client'
import NavBar from "./components/navbar";
import Connect from "./pages/connect";

export default function Home() {
  return (
    <>
      <NavBar />
      <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-12 lg:px-6">
        <div className="max-w-screen-lg text-gray-500 sm:text-lg dark:text-gray-400">
          <Connect />
        </div>
      </div>
    </>
  );
}
