'use client'

import { useState } from "react";
import { SafeInfo } from "./utils/interfaces";
import NavBar from "./components/navbar";
import Payment from "./components/payment";
import Keystore from "./components/keystore";
import SafePanel from "./components/safe_panel";

export default function Main() {
  const [safe, setSafe] = useState<SafeInfo | undefined>()

  return (
    <>
      <NavBar />
      <div className="h-dvh">
        <SafePanel safe={safe} setSafe={setSafe} />
        {/* <Keystore
          safe={safe}
          keystore={keystore}
          setSafe={setSafe}
          setKeystore={setKeystore} />
        <Payment
          safe={safe}
          keystore={keystore} /> */}
      </div>
    </>
  );
}
