import "@xyflow/react/dist/style.css";
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node
} from "@xyflow/react";
import { Maximize2, Network } from "lucide-react";
import { useMemo } from "react";
import type { NetworkDevice, TopologySnapshot } from "../types/domain";
import { riskBand } from "../utils/format";

const colors = {
  critical: "#ff4d62",
  high: "#ff8a3d",
  medium: "#ffd166",
  low: "#59c7d8",
  info: "#8aa3ad"
};

function nodePosition(index: number, total: number, device: NetworkDevice): { x: number; y: number } {
  if (device.type === "firewall" || device.ip.endsWith(".1")) {
    return { x: 40, y: 220 };
  }

  const radius = Math.max(240, total * 34);
  const angle = (index / Math.max(total, 1)) * Math.PI * 2;
  return {
    x: 420 + Math.cos(angle) * radius,
    y: 240 + Math.sin(angle) * Math.min(radius, 220)
  };
}

export function TopologyMap({
  topology,
  selectedId,
  onSelect
}: {
  topology: TopologySnapshot;
  selectedId?: string;
  onSelect: (device: NetworkDevice) => void;
}): JSX.Element {
  const devicesById = useMemo(
    () => new Map(topology.devices.map((device) => [device.id, device])),
    [topology.devices]
  );

  const nodes = useMemo<Node[]>(
    () =>
      topology.devices.map((device, index) => {
        const severity = riskBand(device.riskScore);

        return {
          id: device.id,
          position: nodePosition(index, topology.devices.length, device),
          data: {
            label: `${device.hostname}\n${device.ip}`
          },
          style: {
            width: 172,
            minHeight: 68,
            color: "#d8e8f0",
            background: selectedId === device.id ? "#12313d" : "#071923",
            border: `1px solid ${colors[severity]}`,
            borderRadius: 8,
            boxShadow: device.riskScore >= 75 ? `0 0 24px ${colors[severity]}55` : "0 10px 24px rgba(0,0,0,.22)",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 11,
            whiteSpace: "pre-line"
          }
        };
      }),
    [selectedId, topology.devices]
  );

  const edges = useMemo<Edge[]>(
    () =>
      topology.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: edge.animated,
        label: edge.label,
        markerEnd: { type: MarkerType.ArrowClosed, color: colors[edge.risk] },
        style: {
          stroke: colors[edge.risk],
          strokeWidth: edge.animated ? 2.4 : 1.4
        },
        labelStyle: {
          fill: "#9ab3bd",
          fontSize: 10,
          fontFamily: "JetBrains Mono, monospace"
        },
        labelBgStyle: {
          fill: "#071017",
          fillOpacity: 0.9
        }
      })),
    [topology.edges]
  );

  return (
    <section className="panel topology-panel">
      <header className="panel-header">
        <div>
          <p className="eyebrow">Interactive topology</p>
          <h2>
            <Network size={17} aria-hidden="true" />
            Network graph
          </h2>
        </div>
        <span className="map-badge">
          <Maximize2 size={14} aria-hidden="true" />
          Zoom · pan · drag · minimap
        </span>
      </header>
      <div className="topology-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          minZoom={0.2}
          maxZoom={1.8}
          nodesDraggable
          onNodeClick={(_, node) => {
            const device = devicesById.get(node.id);
            if (device) {
              onSelect(device);
            }
          }}
        >
          <Background color="#143140" gap={24} />
          <MiniMap
            nodeColor={(node) => {
              const device = devicesById.get(node.id);
              return device ? colors[riskBand(device.riskScore)] : "#8aa3ad";
            }}
            maskColor="rgba(3, 10, 14, .72)"
          />
          <Controls />
        </ReactFlow>
      </div>
    </section>
  );
}
