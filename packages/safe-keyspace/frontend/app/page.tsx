'use client'

import { useState } from "react";
import { MultiNetworkSafeInfo, SafeInfo } from "./utils/interfaces";
import NavBar from "./components/navbar";
import { formatHex } from "./utils/utils";
import OpenSafePage from "./components/open_safe";
import ViewSafePage from "./components/view_safe";

export default function Main() {
  const [safe, setSafe] = useState<MultiNetworkSafeInfo | undefined>()
  const [activeTab, setActiveTab] = useState<string>("OPEN")
  console.log(`===> activeTab=${activeTab}`)
  return (
    <>
      <NavBar />

      <div className="h-dvh m-12">
        <div role="tablist" className="tabs tabs-lifted">

          <input
            type="radio"
            name="page_tabs"
            role="tab"
            className={`tab ${activeTab === "OPEN" ? "tab-active" : ""}`}
            style={{ width: "200px" }}
            onClick={() => setActiveTab("OPEN")}
            aria-label="Open a Safe" />
          <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
            <OpenSafePage safe={safe} setSafe={setSafe} setActiveTab={setActiveTab} />
          </div>

          {safe &&
            <>
              <input
                type="radio"
                name="page_tabs"
                role="tab"
                className={`tab ${activeTab === "SAFE" ? "tab-active" : ""}`}
                style={{ width: "200px" }}
                onClick={() => setActiveTab("SAFE")}
                aria-label={"Safe " + formatHex(safe.address)}
              />
              <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
                <ViewSafePage safe={safe} />
              </div>
            </>}
        </div>
      </div>
    </>
  );
}
