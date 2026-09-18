"use client";

import React from "react";
import VehicleManagementView from "../VehicleManagementView";

interface MobileVehicleManagementViewProps {
  isDarkMode: boolean;
  usersList: any[];
  fetchData: (forceRefresh?: boolean) => void;
  API_URL: string;
}

export default function MobileVehicleManagementView(props: MobileVehicleManagementViewProps) {
  return (
    <div className="w-full pb-20 px-1">
      <VehicleManagementView {...props} />
    </div>
  );
}
