'use client';

import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Typography } from 'antd';
import { CircleStop, CirclePlay } from 'lucide-react';

const { Text } = Typography;

// --- CUSTOM NODES (SAME AS DESIGNER BUT FOR VIEWING) ---

const StartNode = ({ data }: any) => (
  <div className="px-4 py-2 rounded-full border-2 border-green-500 bg-white shadow-md flex items-center gap-2 min-w-[100px] justify-center">
    <CirclePlay className="text-green-500" size={14} />
    <span className="font-bold text-slate-700 text-xs">{data.label || 'Bắt đầu'}</span>
  </div>
);

const EndNode = ({ data }: any) => (
  <div className="px-4 py-2 rounded-full border-2 border-red-500 bg-white shadow-md flex items-center gap-2 min-w-[100px] justify-center">
    <CircleStop className="text-red-500" size={14} />
    <span className="font-bold text-slate-700 text-xs">{data.label || 'Kết thúc'}</span>
  </div>
);

const StateNode = ({ data }: any) => (
  <div className="px-4 py-3 rounded-xl border-2 border-slate-200 bg-white shadow-md min-w-[150px]">
    <div className="flex flex-col gap-1">
      <span className="font-bold text-slate-800 text-xs border-b border-slate-50 pb-1">{data.label}</span>
      <span className="text-[10px] font-mono text-blue-500 opacity-70">{data.screenCode}</span>
    </div>
  </div>
);

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  state: StateNode,
};

const DEFAULT_FLOW = JSON.stringify({
  nodes: [
    { id: 'start', type: 'start', position: { x: 100, y: 100 }, data: { label: 'Bắt đầu' } },
    { id: 'end', type: 'end', position: { x: 400, y: 100 }, data: { label: 'Kết thúc' } }
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'end', label: 'Luồng mặc định' }
  ]
});

function ViewerInner({ json = DEFAULT_FLOW }: { json?: string }) {
  const flow = useMemo(() => {
    try {
      return JSON.parse(json || DEFAULT_FLOW);
    } catch (e) {
      console.error('Failed to parse workflow JSON in viewer', e);
      return JSON.parse(DEFAULT_FLOW);
    }
  }, [json]);

  return (
    <div className="w-full h-full bg-slate-50 relative rounded-xl overflow-hidden border border-slate-200">
      <ReactFlow
        nodes={flow.nodes}
        edges={flow.edges}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={true}
        panOnDrag={true}
      >
        <Background color="#e2e8f0" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

export default function WorkflowViewer({ json }: { json?: string }) {
  return (
    <ReactFlowProvider>
      <ViewerInner json={json} />
    </ReactFlowProvider>
  );
}
