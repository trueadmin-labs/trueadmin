type WorkspaceScrollPosition = {
  left: number;
  top: number;
};

const scrollPositions = new Map<string, WorkspaceScrollPosition>();
const scrollTopListeners = new Set<(key: string) => void>();

export const getWorkspaceScroll = (key: string) => scrollPositions.get(key);

export const saveWorkspaceScroll = (key: string, position: WorkspaceScrollPosition) => {
  scrollPositions.set(key, position);
};

export const removeWorkspaceScroll = (key: string) => {
  scrollPositions.delete(key);
};

export const removeWorkspaceScrollExcept = (keys: string[]) => {
  const keySet = new Set(keys);

  for (const key of scrollPositions.keys()) {
    if (!keySet.has(key)) {
      scrollPositions.delete(key);
    }
  }
};

export const requestWorkspaceScrollTop = (key: string) => {
  saveWorkspaceScroll(key, { left: 0, top: 0 });

  for (const listener of scrollTopListeners) {
    listener(key);
  }
};

export const subscribeWorkspaceScrollTop = (listener: (key: string) => void) => {
  scrollTopListeners.add(listener);

  return () => {
    scrollTopListeners.delete(listener);
  };
};
