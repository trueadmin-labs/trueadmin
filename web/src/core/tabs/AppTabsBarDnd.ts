import { type CollisionDetection, closestCenter, type Modifier } from '@dnd-kit/core';

export const restrictToHorizontalAxis: Modifier = ({ transform }) => ({
  ...transform,
  y: 0,
});

export const sameGroupCollisionDetection: CollisionDetection = (args) => {
  const activeGroup = args.active.data.current?.group;
  const droppableContainers = args.droppableContainers.filter(
    (container) => container.data.current?.group === activeGroup,
  );

  return closestCenter({ ...args, droppableContainers });
};
