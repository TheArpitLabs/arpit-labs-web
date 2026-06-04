"use client";

import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Edit2, Trash2, Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import { deleteJourneyEntryAction } from "@/lib/actions/admin-actions";
import { journeyRepository } from "@/lib/repositories/journey.repository";
import { JourneyItem } from "@/types/content";

interface SortableItemProps {
  item: JourneyItem;
}

function SortableItem({ item }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-4 rounded-2xl border border-border/70 bg-background/50 p-4 transition-all hover:border-primary/50 ${
        isDragging ? "opacity-50 ring-2 ring-primary" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted transition hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
            {item.year}
          </span>
          <h4 className="font-semibold text-foreground">{item.title}</h4>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {item.entry_type}
          </span>
          {item.organization && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {item.organization}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
        <Link
          href={`/admin/journey?edit=${item.id}`}
          className="rounded-lg border border-border/70 p-2 text-foreground transition hover:border-primary hover:text-primary"
        >
          <Edit2 className="h-4 w-4" />
        </Link>
        <form action={deleteJourneyEntryAction} onSubmit={(e) => !confirm("Delete this entry?") && e.preventDefault()}>
          <input type="hidden" name="id" value={item.id} />
          <button
            type="submit"
            className="rounded-lg border border-red-500/30 p-2 text-red-500 transition hover:bg-red-500 hover:text-white"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

interface SortableJourneyListProps {
  initialItems: JourneyItem[];
}

export function SortableJourneyList({ initialItems }: SortableJourneyListProps) {
  const [items, setItems] = useState(initialItems);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Save new order
        saveOrder(newItems);
        
        return newItems;
      });
    }
  }

  async function saveOrder(newItems: JourneyItem[]) {
    setIsSaving(true);
    try {
      const payload = newItems.map((item, index) => ({
        id: item.id,
        display_order: index,
      }));
      
      // In a real server action, we'd call journeyRepository.updateOrder
      // But since we want immediate feedback, we'll use a fetch or action
      // For now, we assume a server action will handle this
      const response = await fetch("/api/admin/journey/reorder", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) throw new Error("Failed to save order");
    } catch (err) {
      console.error(err);
      // Revert items on error?
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {isSaving && (
        <div className="flex items-center gap-2 text-xs text-primary animate-pulse">
          <div className="h-2 w-2 rounded-full bg-primary" />
          Saving sequence...
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="grid gap-3">
            {items.map((item) => (
              <SortableItem key={item.id} item={item} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
