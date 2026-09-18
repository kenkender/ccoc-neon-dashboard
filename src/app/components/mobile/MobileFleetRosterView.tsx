"use client";

import React from "react";
import FleetRosterView from "../FleetRosterView";

interface MobileFleetRosterViewProps {
  isDarkMode: boolean;
  currentUser: any;
  usersList: any[];
  missions: any[];
  onRecordMission: (vehicleId: string, affiliation: string, targetVehicleType?: "CCOC Mobile" | "UAV Mobile") => void;
}

export default function MobileFleetRosterView(props: MobileFleetRosterViewProps) {
  return (
    <div className="w-full pb-20 px-1">
      <FleetRosterView {...props} />
    </div>
  );
}
