import * as d3 from "d3";
import {
  ChevronsDownUp,
  ChevronsUpDown,
  LocateFixed,
  Search,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";

import { getBomNodes } from "../api";
import type { BomNode } from "../types";

interface BomTreeProps {
  partId: string;
}

interface TreeNodeData extends BomNode {
  children: TreeNodeData[];
}

const NODE_ROOT_COLOR = "#000000";
const NODE_ASSEMBLY_COLOR = "#007bc0";
const NODE_COMPONENT_COLOR = "#18837e";
const NODE_MATERIAL_COLORS = {
  steel: "#71767c",
  aluminium: "#9e2896",
  thermoplastic: "#00884a",
} as const;
const NODE_RING_SEARCH = "#b8d6ff";
const NODE_DISABLED_COLOR = "#a4abb3";
const LINK_DEFAULT_COLOR = "rgba(113, 118, 124, 0.42)";
const LINK_DISABLED_COLOR = "rgba(164, 171, 179, 0.22)";

export default function BomTree({ partId }: BomTreeProps) {
  const [nodes, setNodes] = useState<BomNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<BomNode>();
  const svgRef = useRef<SVGSVGElement>(null);
  const viewportRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<
    d3.ZoomBehavior<SVGSVGElement, unknown> | undefined
  >(undefined);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    getBomNodes(partId, controller.signal)
      .then(({ data }) => {
        setNodes(data);
        const root = data.find((node) => node.parent_node_key === null);
        setExpanded(root ? new Set([root.node_key]) : new Set());
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "The BOM tree could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [partId]);

  const nodeByKey = useMemo(
    () => new Map(nodes.map((node) => [node.node_key, node])),
    [nodes],
  );

  const matches = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return new Set<string>();
    }

    return new Set(
      nodes
        .filter((node) =>
          [
            node.material_number,
            node.description,
            node.source,
            String(node.level),
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery),
        )
        .map((node) => node.node_key),
    );
  }, [nodes, query]);

  useEffect(() => {
    if (matches.size === 0) {
      return;
    }

    setExpanded((current) => {
      const next = new Set(current);

      matches.forEach((nodeKey) => {
        let currentNode = nodeByKey.get(nodeKey);
        while (currentNode?.parent_node_key) {
          next.add(currentNode.parent_node_key);
          currentNode = nodeByKey.get(currentNode.parent_node_key);
        }
      });

      return next;
    });
  }, [matches, nodeByKey]);

  const rootData = useMemo(
    () => buildTree(nodes, expanded),
    [nodes, expanded],
  );

  const layout = useMemo(() => {
    if (!rootData) {
      return undefined;
    }

    const hierarchy = d3.hierarchy(rootData);
    return d3
      .tree<TreeNodeData>()
      .nodeSize([58, 245])
      .separation((a, b) => (a.parent === b.parent ? 1.05 : 1.35))(hierarchy);
  }, [rootData]);

  const maximumPcf = useMemo(
    () => Math.max(...nodes.map((node) => Number(node.pcf)), 1),
    [nodes],
  );

  useEffect(() => {
    const svgElement = svgRef.current;
    const viewportElement = viewportRef.current;
    if (!svgElement || !viewportElement) {
      return;
    }

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.18, 2.5])
      .on("zoom", (event) => {
        d3.select(viewportElement).attr("transform", event.transform.toString());
      });

    zoomRef.current = zoom;
    d3.select(svgElement).call(zoom);
    centerTree(false);

    return () => {
      d3.select(svgElement).on(".zoom", null);
    };
  }, [layout]);

  function centerTree(animated = true) {
    const svgElement = svgRef.current;
    const zoom = zoomRef.current;
    if (!svgElement || !zoom || !layout) {
      return;
    }

    const bounds = svgElement.getBoundingClientRect();
    const descendants = layout.descendants();
    const minX = d3.min(descendants, (node) => node.x) ?? 0;
    const maxX = d3.max(descendants, (node) => node.x) ?? 0;
    const maxY = d3.max(descendants, (node) => node.y) ?? 0;
    const treeHeight = Math.max(maxX - minX + 120, 1);
    const treeWidth = Math.max(maxY + 420, 1);
    const scale = Math.min(
      1,
      Math.max(
        0.22,
        Math.min(bounds.width / treeWidth, bounds.height / treeHeight) * 0.92,
      ),
    );
    const transform = d3.zoomIdentity
      .translate(72, bounds.height / 2 - ((minX + maxX) / 2) * scale)
      .scale(scale);
    const selection = d3.select(svgElement);

    if (animated) {
      selection.transition().duration(350).call(zoom.transform, transform);
    } else {
      selection.call(zoom.transform, transform);
    }
  }

  function toggleNode(node: d3.HierarchyPointNode<TreeNodeData>) {
    if (node.data.children.length === 0 && !hasChildren(nodes, node.data.node_key)) {
      setSelected(node.data);
      return;
    }

    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(node.data.node_key)) {
        next.delete(node.data.node_key);
      } else {
        next.add(node.data.node_key);
      }
      return next;
    });
    setSelected(node.data);
  }

  function expandAll() {
    setExpanded(
      new Set(
        nodes
          .filter((node) => !node.is_leaf && hasChildren(nodes, node.node_key))
          .map((node) => node.node_key),
      ),
    );
  }

  function collapseAll() {
    setExpanded(new Set());
  }

  if (loading) {
    return <div className="bom-tree-state">Loading BOM structure...</div>;
  }

  if (error || !layout) {
    return (
      <div className="bom-tree-state error-state">
        {error ?? "No BOM structure is available."}
      </div>
    );
  }

  return (
    <div className="bom-tree">
      <div className="bom-tree-toolbar">
        <label className="bom-search">
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search material number or description"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear BOM search"
            >
              <X size={15} />
            </button>
          )}
        </label>
        <div className="bom-search-result" aria-live="polite">
          {query.trim()
            ? `${matches.size} matching ${matches.size === 1 ? "node" : "nodes"}`
            : `${nodes.length} BOM nodes`}
        </div>
        <div className="bom-tree-actions">
          <button type="button" className="secondary-button" onClick={expandAll}>
            <ChevronsUpDown size={16} />
            Expand all
          </button>
          <button type="button" className="secondary-button" onClick={collapseAll}>
            <ChevronsDownUp size={16} />
            Collapse all
          </button>
          <button
            type="button"
            className="secondary-button icon-only-button"
            onClick={() => centerTree()}
            title="Center tree"
            aria-label="Center tree"
          >
            <LocateFixed size={16} />
          </button>
        </div>
      </div>

      <div className="bom-tree-canvas">
        <svg ref={svgRef} aria-label="Interactive bill of materials tree">
          <g ref={viewportRef}>
            {layout.links().map((link) => (
              <path
                key={`${link.source.data.node_key}-${link.target.data.node_key}`}
                className="bom-link"
                d={linkPath(link)}
                stroke={query.trim() ? LINK_DISABLED_COLOR : LINK_DEFAULT_COLOR}
              />
            ))}
            {layout.descendants().map((node) => {
              const isMatch = matches.has(node.data.node_key);
              const searchActive = query.trim().length > 0;
              const isDimmed = searchActive && !isMatch;
              const radius = getNodeRadius(node.data, maximumPcf);

              return (
                <g
                  key={node.data.node_key}
                  className={`bom-node${isMatch ? " search-match" : ""}`}
                  transform={`translate(${node.y},${node.x})`}
                  onClick={() => toggleNode(node)}
                  onContextMenu={(event) => selectFromContext(event, node.data)}
                >
                  {isMatch && (
                    <circle
                      r={radius + 7}
                      fill="none"
                      stroke={NODE_RING_SEARCH}
                      strokeWidth={5}
                    />
                  )}
                  <circle
                    r={radius}
                    fill={
                      isDimmed
                        ? NODE_DISABLED_COLOR
                        : getNodeColor(node.data)
                    }
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                  <text
                    x={radius + 10}
                    dy="-0.15em"
                    className={isDimmed ? "dimmed" : undefined}
                  >
                    {truncate(node.data.description, 31)}
                  </text>
                  <text
                    x={radius + 10}
                    dy="1.2em"
                    className={`bom-node-number${isDimmed ? " dimmed" : ""}`}
                  >
                    {node.data.material_number}
                  </text>
                  <title>
                    {`${node.data.description}\n${node.data.material_number}\n${Number(node.data.pcf).toFixed(4)} kgCO2eq/pc`}
                  </title>
                </g>
              );
            })}
          </g>
        </svg>

        {selected && (
          <aside className="bom-node-details">
            <button
              type="button"
              onClick={() => setSelected(undefined)}
              aria-label="Close node details"
            >
              <X size={15} />
            </button>
            <p className="eyebrow">Selected node</p>
            <h3>{selected.description}</h3>
            <dl>
              <Detail label="Part Number" value={selected.material_number} />
              <Detail label="Level" value={String(selected.level)} />
              <Detail label="Source" value={selected.source} />
              <Detail label="Quantity" value={String(selected.quantity)} />
              <Detail
                label="PCF"
                value={`${Number(selected.pcf).toFixed(4)} kgCO2eq/pc`}
              />
              <Detail
                label="Upstream PCF"
                value={`${Number(selected.pcf_upstream).toFixed(4)} kgCO2eq/pc`}
              />
              <Detail
                label="MCF"
                value={`${Number(selected.mcf).toFixed(4)} kgCO2eq/pc`}
              />
            </dl>
          </aside>
        )}
      </div>
    </div>
  );

  function selectFromContext(
    event: MouseEvent<SVGGElement>,
    node: BomNode,
  ) {
    event.preventDefault();
    setSelected(node);
  }
}

function buildTree(
  nodes: BomNode[],
  expanded: Set<string>,
): TreeNodeData | undefined {
  const childrenByParent = new Map<string | null, BomNode[]>();

  nodes.forEach((node) => {
    const siblings = childrenByParent.get(node.parent_node_key) ?? [];
    siblings.push(node);
    childrenByParent.set(node.parent_node_key, siblings);
  });

  const createNode = (node: BomNode): TreeNodeData => ({
    ...node,
    children: expanded.has(node.node_key)
      ? (childrenByParent.get(node.node_key) ?? []).map(createNode)
      : [],
  });
  const root = childrenByParent.get(null)?.[0];

  return root ? createNode(root) : undefined;
}

function hasChildren(nodes: BomNode[], nodeKey: string): boolean {
  return nodes.some((node) => node.parent_node_key === nodeKey);
}

function getNodeRadius(node: BomNode, maximumPcf: number): number {
  if (node.level === 0) {
    return 27;
  }

  const normalized = Math.sqrt(
    Math.max(0, Math.min(1, Number(node.pcf) / maximumPcf)),
  );
  return Math.max(5, Math.min(22, 5 + normalized * 17));
}

function getNodeColor(node: BomNode): string {
  if (node.level === 0) {
    return NODE_ROOT_COLOR;
  }

  if (node.level === 1) {
    return NODE_ASSEMBLY_COLOR;
  }

  if (node.level === 2) {
    return NODE_COMPONENT_COLOR;
  }

  const description = node.description.toLowerCase();
  if (description.includes("aluminium")) {
    return NODE_MATERIAL_COLORS.aluminium;
  }
  if (description.includes("thermoplastic")) {
    return NODE_MATERIAL_COLORS.thermoplastic;
  }

  return NODE_MATERIAL_COLORS.steel;
}

function linkPath(
  link: d3.HierarchyPointLink<TreeNodeData>,
): string {
  const middle = (link.source.y + link.target.y) / 2;
  return `M${link.source.y},${link.source.x}C${middle},${link.source.x} ${middle},${link.target.x} ${link.target.y},${link.target.x}`;
}

function truncate(value: string, length: number): string {
  return value.length > length ? `${value.slice(0, length - 3)}...` : value;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
