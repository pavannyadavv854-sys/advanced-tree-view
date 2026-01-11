// Advanced TreeView.tsx
// Full-featured Tree View with Drag & Drop, Icons, Checkbox, Search, Context Menu

import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// -------------------- Data Model --------------------
export interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
  isExpanded?: boolean;
  checked?: boolean;
  type?: "folder" | "file";
}

const generateId = () => Math.random().toString(36).substring(2, 9);

// -------------------- Sortable Node --------------------
const SortableNode: React.FC<{ id: string; children: React.ReactNode }> = ({
  id,
  children,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

// -------------------- Tree Node --------------------
interface NodeProps {
  node: TreeNode;
  level: number;
  onToggle: (id: string) => void;
  onCheck: (id: string) => void;
  onContext: (e: React.MouseEvent, id: string) => void;
}

const TreeNodeItem: React.FC<NodeProps> = ({
  node,
  level,
  onToggle,
  onCheck,
  onContext,
}) => {
  return (
    <div style={{ marginLeft: level * 20 }}>
      <div
        onContextMenu={(e) => onContext(e, node.id)}
        style={{ display: "flex", alignItems: "center", gap: 6 }}
      >
        {node.type === "folder" && (
          <span onClick={() => onToggle(node.id)}>
            {node.isExpanded ? "📂" : "📁"}
          </span>
        )}
        {node.type === "file" && <span>📄</span>}

        <input
          type="checkbox"
          checked={!!node.checked}
          onChange={() => onCheck(node.id)}
        />
        <span>{node.name}</span>
      </div>

      {node.isExpanded && node.children && (
        <SortableContext
          items={node.children.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {node.children.map((child) => (
            <SortableNode key={child.id} id={child.id}>
              <TreeNodeItem
                node={child}
                level={level + 1}
                onToggle={onToggle}
                onCheck={onCheck}
                onContext={onContext}
              />
            </SortableNode>
          ))}
        </SortableContext>
      )}
    </div>
  );
};

// -------------------- Tree View --------------------
export const TreeView: React.FC = () => {
  const [search, setSearch] = useState("");
  const [contextNode, setContextNode] = useState<string | null>(null);

  const [tree, setTree] = useState<TreeNode[]>([
    {
      id: generateId(),
      name: "Level A",
      type: "folder",
      isExpanded: true,
      children: [
        {
          id: generateId(),
          name: "Level A",
          type: "folder",
          children: [{ id: generateId(), name: "Level A", type: "file" }],
        },
      ],
    },
  ]);

  // -------- Toggle Expand --------
  const toggle = (id: string) => {
    const update = (nodes: TreeNode[]): TreeNode[] =>
      nodes.map((n) => {
        if (n.id === id) return { ...n, isExpanded: !n.isExpanded };
        if (n.children) n.children = update(n.children);
        return n;
      });
    setTree(update([...tree]));
  };

  // -------- Checkbox --------
  const check = (id: string) => {
    const update = (nodes: TreeNode[]): TreeNode[] =>
      nodes.map((n) => {
        if (n.id === id) return { ...n, checked: !n.checked };
        if (n.children) n.children = update(n.children);
        return n;
      });
    setTree(update([...tree]));
  };

  // -------- Drag & Drop --------
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const reorder = (nodes: TreeNode[]): TreeNode[] => {
      const ids = nodes.map((n) => n.id);
      if (ids.includes(active.id as string) && ids.includes(over.id as string)) {
        const oldIndex = ids.indexOf(active.id as string);
        const newIndex = ids.indexOf(over.id as string);
        const updated = [...nodes];
        const [moved] = updated.splice(oldIndex, 1);
        updated.splice(newIndex, 0, moved);
        return updated;
      }
      return nodes.map((n) => ({
        ...n,
        children: n.children ? reorder(n.children) : undefined,
      }));
    };

    setTree(reorder([...tree]));
  };

  // -------- Context Menu --------
  const onContext = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextNode(id);
  };

  const addNode = (type: "file" | "folder") => {
    if (!contextNode) return;
    const name = prompt(`New ${type} name`);
    if (!name) return;

    const update = (nodes: TreeNode[]): TreeNode[] =>
      nodes.map((n) => {
        if (n.id === contextNode) {
          return {
            ...n,
            isExpanded: true,
            children: [
              ...(n.children || []),
              { id: generateId(), name, type },
            ],
          };
        }
        if (n.children) n.children = update(n.children);
        return n;
      });

    setTree(update([...tree]));
    setContextNode(null);
  };

  // -------- Search --------
  const filterTree = (nodes: TreeNode[]): TreeNode[] =>
    nodes
      .filter((n) => n.name.toLowerCase().includes(search.toLowerCase()))
      .map((n) => ({
        ...n,
        children: n.children ? filterTree(n.children) : undefined,
      }));

  return (
    <div>
      <h3>Advanced Tree View</h3>
      <input
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {filterTree(tree).map((node) => (
          <SortableContext
            key={node.id}
            items={[node.id]}
            strategy={verticalListSortingStrategy}
          >
            <SortableNode id={node.id}>
              <TreeNodeItem
                node={node}
                level={0}
                onToggle={toggle}
                onCheck={check}
                onContext={onContext}
              />
            </SortableNode>
          </SortableContext>
        ))}
      </DndContext>

      {contextNode && (
        <div style={{ border: "1px solid #ccc", padding: 8 }}>
          <button onClick={() => addNode("folder")}>Add Folder</button>
          <button onClick={() => addNode("file")}>Add File</button>
          <button onClick={() => setContextNode(null)}>Close</button>
        </div>
      )}
    </div>
  );
};
