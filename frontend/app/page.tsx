'use client'

import { useState } from "react";
import { SafeInfo } from "./utils/interfaces";
import NavBar from "./components/navbar";
import Payment from "./components/payment";
import Keystore from "./components/keystore";

export default function Main() {
  const [safe, setSafe] = useState<SafeInfo | undefined>()
  const [keystore, setKeystore] = useState<SafeInfo | undefined>()

  return (
    <>
      <NavBar />
      <Keystore
        safe={safe}
        keystore={keystore}
        setSafe={setSafe}
        setKeystore={setKeystore} />
      <Payment
        safe={safe}
        keystore={keystore} />
    </>
  );
}
