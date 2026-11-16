// @ts-nocheck
import { writable } from "svelte/store";
import { createBackup, getAvailableBackupSections, importBackup } from "../db/backupService.js";

function createBackupStore() {
  const { subscribe, set } = writable({ busy: false });

  async function exportData(selection) {
    set({ busy: true });
    try {
      const backup = await createBackup(selection);
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `svelter-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      set({ busy: false });
    }
  }

  async function importData(file, selection) {
    set({ busy: true });
    try {
      const backup = JSON.parse(await file.text());
      await importBackup(backup, selection);
    } finally {
      set({ busy: false });
    }
  }

  async function inspectFile(file) {
    return getAvailableBackupSections(JSON.parse(await file.text()));
  }

  return { subscribe, exportData, importData, inspectFile };
}

export const backupStore = createBackupStore();
