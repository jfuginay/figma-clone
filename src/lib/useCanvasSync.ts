"use client";

import { useEffect, useRef, useCallback } from "react";
import * as fabric from "fabric";
import { useMutation, useStorage, useSelf } from "@/liveblocks.config";
import { CanvasObject } from "@/types/canvas";
import {
  serializeFabricObject,
  deserializeLiveblocksObject,
  updateFabricObject,
  debounce,
} from "./canvas-sync";

/**
 * Hook to sync Fabric.js canvas with Liveblocks storage
 */
export function useCanvasSync(canvas: fabric.Canvas | null) {
  const self = useSelf();
  const isLocalChangeRef = useRef(false);

  // Get current user ID
  const currentUserId = self?.id;

  // Subscribe to Liveblocks storage changes
  const objects = useStorage((root) => root.objects);

  // Mutation to remove object from Liveblocks
  const removeLiveblocksObject = useMutation(({ storage }, id: string) => {
    const objectsMap = storage.get("objects");
    objectsMap.delete(id);
  }, []);

  // Mutation to clear all objects
  const clearLiveblocksObjects = useMutation(({ storage }) => {
    const objectsMap = storage.get("objects");
    // Clear all keys from the LiveMap
    const keys = Array.from(objectsMap.keys());
    keys.forEach((key) => objectsMap.delete(key));
  }, []);

  // Fabric -> Liveblocks sync (debounced)
  const syncToLiveblocks = useMutation(
    ({ storage }, fabricObject: fabric.Object) => {
      if (!canvas || isLocalChangeRef.current) return;

      const serialized = serializeFabricObject(fabricObject);
      if (serialized) {
        // Increment version for conflict resolution
        serialized.version = (serialized.version || 0) + 1;
        const objectsMap = storage.get("objects");
        objectsMap.set(serialized.id, serialized);
      }
    },
    [canvas]
  );

  // Create a stable debounced function
  const debouncedSyncRef = useRef<(fabricObject: fabric.Object) => void>(
    () => {
      // This will be updated with the latest syncToLiveblocks
    }
  );

  // Update the debounced function's internal reference
  useEffect(() => {
    const debouncedFn = debounce<[fabric.Object]>((fabricObject: fabric.Object) => {
      syncToLiveblocks(fabricObject);
    }, 50);
    debouncedSyncRef.current = debouncedFn;
  }, [syncToLiveblocks]);

  const debouncedSyncToLiveblocks = useCallback(
    (fabricObject: fabric.Object) => {
      debouncedSyncRef.current(fabricObject);
    },
    []
  );

  // Handle Fabric object events
  useEffect(() => {
    if (!canvas) return;

    const handleObjectAdded = (e: { target: fabric.Object }) => {
      if (!e.target || isLocalChangeRef.current) return;

      const fabricObject = e.target;

      // Assign ID if not present
      if (!(fabricObject as fabric.Object & { id?: string }).id) {
        (fabricObject as fabric.Object & { id: string }).id = `object-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
      }

      debouncedSyncToLiveblocks(fabricObject);
    };

    const handleObjectModified = (e: { target: fabric.Object }) => {
      if (!e.target || isLocalChangeRef.current) return;
      debouncedSyncToLiveblocks(e.target);
    };

    const handleObjectRemoved = (e: { target: fabric.Object }) => {
      if (!e.target || isLocalChangeRef.current) return;

      const id = (e.target as fabric.Object & { id?: string }).id;
      if (id) {
        removeLiveblocksObject(id);
      }
    };

    // Add event listeners
    canvas.on("object:added", handleObjectAdded);
    canvas.on("object:modified", handleObjectModified);
    canvas.on("object:removed", handleObjectRemoved);

    // Cleanup
    return () => {
      canvas.off("object:added", handleObjectAdded);
      canvas.off("object:modified", handleObjectModified);
      canvas.off("object:removed", handleObjectRemoved);
    };
  }, [canvas, debouncedSyncToLiveblocks, removeLiveblocksObject]);

  // Liveblocks -> Fabric sync
  useEffect(() => {
    if (!canvas || !objects) return;

    // Mark as local change to prevent feedback loops
    isLocalChangeRef.current = true;

    const currentFabricObjects = new Map<string, fabric.Object>();
    canvas.getObjects().forEach((obj) => {
      const id = (obj as fabric.Object & { id?: string; data?: { isGrid?: boolean } }).id;
      const isGrid = (obj as fabric.Object & { data?: { isGrid?: boolean } }).data?.isGrid;
      if (id && !isGrid) {
        currentFabricObjects.set(id, obj);
      }
    });

    // Get Liveblocks object IDs
    const liveblocksIds = new Set<string>();
    if (objects && typeof objects === "object") {
      // Handle LiveMap structure
      const objMap = objects as { entries?: () => Iterable<[string, CanvasObject]> };
      if (objMap.entries) {
        for (const [id] of objMap.entries()) {
          liveblocksIds.add(id);
        }
      }
    }

    // Remove objects that no longer exist in Liveblocks
    currentFabricObjects.forEach((fabricObj, id) => {
      if (!liveblocksIds.has(id)) {
        canvas.remove(fabricObj);
      }
    });

    // Add or update objects from Liveblocks
    if (objects && typeof objects === "object") {
      const objMap = objects as { entries?: () => Iterable<[string, CanvasObject]> };
      if (objMap.entries) {
        for (const [id, lbObject] of objMap.entries()) {
          const existingFabricObj = currentFabricObjects.get(id);

          if (existingFabricObj) {
            // Update existing object
            const currentVersion = (existingFabricObj as fabric.Object & { version?: number }).version || 0;
            const remoteVersion = lbObject.version || 0;

            // Only update if remote version is newer
            if (remoteVersion > currentVersion) {
              updateFabricObject(existingFabricObj, lbObject);
              canvas.requestRenderAll();
            }
          } else {
            // Create new object
            const newFabricObj = deserializeLiveblocksObject(lbObject);
            if (newFabricObj) {
              canvas.add(newFabricObj);
            }
          }
        }
      }
    }

    canvas.requestRenderAll();

    // Reset flag after a short delay
    setTimeout(() => {
      isLocalChangeRef.current = false;
    }, 100);
  }, [canvas, objects, currentUserId]);

  // Initial sync: Load existing objects from Liveblocks
  useEffect(() => {
    if (!canvas || !objects) return;

    isLocalChangeRef.current = true;

    // Clear canvas (except grid)
    const gridObjects = canvas
      .getObjects()
      .filter((obj) => (obj as fabric.Object & { data?: { isGrid?: boolean } }).data?.isGrid);
    canvas.clear();
    gridObjects.forEach((obj) => canvas.add(obj));

    // Load objects from Liveblocks
    if (objects && typeof objects === "object") {
      const objMap = objects as { entries?: () => Iterable<[string, CanvasObject]> };
      if (objMap.entries) {
        for (const [, lbObject] of objMap.entries()) {
          const fabricObj = deserializeLiveblocksObject(lbObject);
          if (fabricObj) {
            canvas.add(fabricObj);
          }
        }
      }
    }

    canvas.requestRenderAll();

    setTimeout(() => {
      isLocalChangeRef.current = false;
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, currentUserId]); // Only run when canvas or user changes, not objects

  return {
    clearCanvas: () => {
      if (canvas) {
        isLocalChangeRef.current = true;
        const gridObjects = canvas
          .getObjects()
          .filter((obj) => (obj as fabric.Object & { data?: { isGrid?: boolean } }).data?.isGrid);
        canvas.clear();
        gridObjects.forEach((obj) => canvas.add(obj));
        clearLiveblocksObjects();
        setTimeout(() => {
          isLocalChangeRef.current = false;
        }, 100);
      }
    },
  };
}
