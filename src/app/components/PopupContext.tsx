"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import UploadProgressModal, { UploadStage } from "./UploadProgressModal";
import NotificationModal, { NotificationType } from "./NotificationModal";
import ConfirmModal from "./ConfirmModal";

export interface NotificationOptions {
  title: string;
  message: string;
  type?: NotificationType;
  details?: string[];
  confirmText?: string;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export interface UploadProgressOptions {
  stage: UploadStage;
  progress: number;
  currentFileName?: string;
  files?: File[];
  missionName?: string;
  totalFiles?: number;
  errorMessage?: string;
}

interface PopupContextType {
  showNotification: (options: NotificationOptions) => void;
  showConfirm: (options: ConfirmOptions) => void;
  showUploadProgress: (options: UploadProgressOptions) => void;
  updateUploadProgress: (update: Partial<UploadProgressOptions>) => void;
  closeUploadProgress: () => void;
  closeNotification: () => void;
  closeConfirm: () => void;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export function PopupProvider({ children }: { children: ReactNode }) {
  // Notification State
  const [notifState, setNotifState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: NotificationType;
    details?: string[];
    confirmText?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  // Confirm State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Upload Progress State
  const [uploadState, setUploadState] = useState<{
    isOpen: boolean;
    stage: UploadStage;
    progress: number;
    currentFileName?: string;
    files?: File[];
    missionName?: string;
    totalFiles?: number;
    errorMessage?: string;
  }>({
    isOpen: false,
    stage: "sending_data",
    progress: 0,
  });

  const showNotification = (options: NotificationOptions) => {
    setNotifState({
      isOpen: true,
      title: options.title,
      message: options.message,
      type: options.type || "info",
      details: options.details,
      confirmText: options.confirmText || "ตกลง",
    });
  };

  const closeNotification = () => {
    setNotifState((prev) => ({ ...prev, isOpen: false }));
  };

  const showConfirm = (options: ConfirmOptions) => {
    setConfirmState({
      isOpen: true,
      title: options.title,
      message: options.message,
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      isDanger: options.isDanger ?? true,
    });
  };

  const closeConfirm = () => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  };

  const showUploadProgress = (options: UploadProgressOptions) => {
    setUploadState({
      isOpen: true,
      stage: options.stage,
      progress: options.progress,
      currentFileName: options.currentFileName,
      files: options.files,
      missionName: options.missionName,
      totalFiles: options.totalFiles,
      errorMessage: options.errorMessage,
    });
  };

  const updateUploadProgress = (update: Partial<UploadProgressOptions>) => {
    setUploadState((prev) => ({
      ...prev,
      ...update,
    }));
  };

  const closeUploadProgress = () => {
    setUploadState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <PopupContext.Provider
      value={{
        showNotification,
        showConfirm,
        showUploadProgress,
        updateUploadProgress,
        closeUploadProgress,
        closeNotification,
        closeConfirm,
      }}
    >
      {children}

      {/* Render All Global Cyberpunk Modals */}
      <UploadProgressModal
        isOpen={uploadState.isOpen}
        stage={uploadState.stage}
        progress={uploadState.progress}
        currentFileName={uploadState.currentFileName}
        files={uploadState.files}
        missionName={uploadState.missionName}
        totalFiles={uploadState.totalFiles}
        errorMessage={uploadState.errorMessage}
        onClose={closeUploadProgress}
      />

      <NotificationModal
        isOpen={notifState.isOpen}
        title={notifState.title}
        message={notifState.message}
        type={notifState.type}
        details={notifState.details}
        confirmText={notifState.confirmText}
        onClose={closeNotification}
      />

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        isDanger={confirmState.isDanger}
        onCancel={() => {
          if (confirmState.onCancel) confirmState.onCancel();
          closeConfirm();
        }}
        onConfirm={() => {
          confirmState.onConfirm();
          closeConfirm();
        }}
      />
    </PopupContext.Provider>
  );
}

export function usePopup() {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error("usePopup must be used within a PopupProvider");
  }
  return context;
}
