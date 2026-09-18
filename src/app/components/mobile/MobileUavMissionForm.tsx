"use client";

import React from "react";
import UavMissionForm from "../UavMissionForm";

interface MobileUavMissionFormProps {
  isDarkMode: boolean;
  currentUser: any;
  usersList: any[];
  formData: any;
  handleChange: (e: any) => void;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  onSubmit: (e: any) => void;
  isSubmitting: boolean;
  setShowMapOverlay: (show: boolean) => void;
  onSwitchFormType: (type: "CCOC Mobile" | "UAV Mobile") => void;
}

export default function MobileUavMissionForm(props: MobileUavMissionFormProps) {
  return (
    <div className="w-full pb-24 px-1">
      <UavMissionForm {...props} />
    </div>
  );
}
