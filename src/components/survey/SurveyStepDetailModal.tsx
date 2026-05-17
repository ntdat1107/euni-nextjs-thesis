'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal, Button, Typography, Space, Tag, Table,
  Input, Row, Col, Checkbox, Divider, Card, Tabs
} from 'antd';
import {
  Save, X, Plus, Trash2, Info, CheckCircle2,
  ListOrdered, LayoutGrid, FileText
} from 'lucide-react';

const { Title, Text, Paragraph } = Typography;

interface SurveyStepDetailModalProps {
  open: boolean;
  onClose: () => void;
  step: any;
  campaignId?: string;
  readonly?: boolean;
}

export default function SurveyStepDetailModal({
  open,
  onClose,
  step,
  readonly = false
}: SurveyStepDetailModalProps) {
  const [activeTab, setActiveTab] = useState('editor');

  const renderContent = () => {
    const screenCode = step?.configuration?.screenCode;

    switch (screenCode) {
      case 'S2_PLO':
        return <S2PLORenderer step={step} readonly={readonly} />;
      case 'S5_CLO':
        return <S5CLORenderer step={step} readonly={readonly} />;
      case 'S6_MATRIX':
        return <S6MatrixRenderer step={step} readonly={readonly} />;
      default:
        return (
          <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Info className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <Text className="text-slate-500 font-medium">
              Chưa có giao diện cho bước này ({screenCode || 'N/A'})
            </Text>
          </div>
        );
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 pr-8">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <FileText size={18} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">
              Chi tiết bước thực hiện
            </div>
            <div className="text-lg font-bold text-slate-800">
              {step?.title || 'Không rõ'}
            </div>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="close" onClick={onClose} className="rounded-lg h-10 px-6">
          Đóng
        </Button>,
        !readonly && (
          <Button key="save" type="primary" icon={<Save size={16} />} className="rounded-lg h-10 px-6 bg-blue-600">
            Lưu thay đổi
          </Button>
        )
      ].filter(Boolean)}
      className="survey-step-detail-modal"
      centered
      styles={{ body: { padding: '24px', minHeight: '400px' } }}
    >
      {renderContent()}
    </Modal>
  );
}

// --- S2_PLO Renderer ---
function S2PLORenderer({ step, readonly }: { step: any; readonly: boolean }) {
  const [peos, setPeos] = useState([{ content: '' }]);
  const [plos, setPlos] = useState([
    { content: '', pis: [{ content: '' }, { content: '' }] }
  ]);
  // matrix[peoIdx][ploIdx][piIdx]
  const [matrix, setMatrix] = useState<boolean[][][]>([]);

  useEffect(() => {
    // Initialize matrix shape
    const newMatrix = peos.map(() =>
      plos.map(plo => plo.pis.map(() => false))
    );
    setMatrix(newMatrix);
  }, []);

  const addPeo = () => setPeos([...peos, { content: '' }]);
  const removePeo = (idx: number) => setPeos(peos.filter((_, i) => i !== idx));

  const addPlo = () => setPlos([...plos, { content: '', pis: [{ content: '' }] }]);
  const removePlo = (idx: number) => setPlos(plos.filter((_, i) => i !== idx));

  const addPi = (ploIdx: number) => {
    const newPlos = [...plos];
    newPlos[ploIdx].pis.push({ content: '' });
    setPlos(newPlos);
  };

  const toggleMatrix = (peoIdx: number, ploIdx: number, piIdx: number) => {
    const newMatrix = [...matrix];
    if (!newMatrix[peoIdx]) newMatrix[peoIdx] = [];
    if (!newMatrix[peoIdx][ploIdx]) newMatrix[peoIdx][ploIdx] = [];
    newMatrix[peoIdx][ploIdx][piIdx] = !newMatrix[peoIdx][ploIdx][piIdx];
    setMatrix(newMatrix);
  };

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between mb-4">
          <Title level={5} className="!mb-0 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
            1. Mục tiêu đào tạo (PEO)
          </Title>
          {!readonly && (
            <Button type="dashed" icon={<Plus size={14} />} onClick={addPeo} size="small">
              Thêm PEO
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {peos.map((peo, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="w-16 flex-shrink-0 pt-2 font-bold text-slate-400">PEO{idx + 1}</div>
              <Input.TextArea
                value={peo.content}
                placeholder="Nhập nội dung mục tiêu..."
                autoSize={{ minRows: 2 }}
                className="rounded-lg"
                disabled={readonly}
                onChange={e => {
                  const newPeos = [...peos];
                  newPeos[idx].content = e.target.value;
                  setPeos(newPeos);
                }}
              />
              {!readonly && (
                <Button
                  type="text"
                  danger
                  icon={<Trash2 size={16} />}
                  onClick={() => removePeo(idx)}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <Title level={5} className="!mb-0 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
            2. Chuẩn đầu ra (PLO) & Chỉ số (PI)
          </Title>
          {!readonly && (
            <Button type="dashed" icon={<Plus size={14} />} onClick={addPlo} size="small">
              Thêm PLO
            </Button>
          )}
        </div>
        <div className="space-y-6">
          {plos.map((plo, ploIdx) => (
            <Card key={ploIdx} size="small" className="rounded-xl border-slate-100 bg-slate-50/30">
              <div className="flex gap-3 mb-4">
                <div className="w-16 flex-shrink-0 pt-2 font-bold text-slate-400">PLO{ploIdx + 1}</div>
                <Input.TextArea
                  value={plo.content}
                  placeholder="Nhập nội dung chuẩn đầu ra..."
                  autoSize={{ minRows: 2 }}
                  className="rounded-lg"
                  disabled={readonly}
                  onChange={e => {
                    const newPlos = [...plos];
                    newPlos[ploIdx].content = e.target.value;
                    setPlos(newPlos);
                  }}
                />
                {!readonly && (
                  <Button
                    type="text"
                    danger
                    icon={<Trash2 size={16} />}
                    onClick={() => removePlo(ploIdx)}
                  />
                )}
              </div>
              <div className="pl-16 space-y-3">
                <div className="flex items-center justify-between">
                  <Text className="text-xs font-bold text-slate-400 uppercase">Chỉ số năng lực (PI)</Text>
                  {!readonly && (
                    <Button type="link" size="small" icon={<Plus size={12} />} onClick={() => addPi(ploIdx)}>
                      Thêm PI
                    </Button>
                  )}
                </div>
                {plo.pis.map((pi, piIdx) => (
                  <div key={piIdx} className="flex gap-3">
                    <div className="w-16 flex-shrink-0 pt-2 text-xs font-bold text-slate-400">PI{ploIdx + 1}.{piIdx + 1}</div>
                    <Input
                      value={pi.content}
                      placeholder="Nội dung PI..."
                      className="rounded-lg text-sm"
                      disabled={readonly}
                      onChange={e => {
                        const newPlos = [...plos];
                        newPlos[ploIdx].pis[piIdx].content = e.target.value;
                        setPlos(newPlos);
                      }}
                    />
                    {!readonly && (
                      <Button
                        type="text"
                        danger
                        icon={<Trash2 size={14} />}
                        onClick={() => {
                          const newPlos = [...plos];
                          newPlos[ploIdx].pis = newPlos[ploIdx].pis.filter((_, i) => i !== piIdx);
                          setPlos(newPlos);
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <Title level={5} className="mb-4 flex items-center gap-2">
          <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
          3. Ma trận Mục tiêu (PEO) & Chuẩn đầu ra (PLO)
        </Title>
        <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left border-b border-r border-slate-100" rowSpan={2}>PEO / PI</th>
                {plos.map((plo, ploIdx) => (
                  <th key={ploIdx} colSpan={plo.pis.length} className="p-2 text-center border-b border-r border-slate-100 font-bold">
                    PLO{ploIdx + 1}
                  </th>
                ))}
              </tr>
              <tr>
                {plos.map((plo, ploIdx) => (
                  plo.pis.map((_, piIdx) => (
                    <th key={`${ploIdx}-${piIdx}`} className="p-2 text-center border-b border-r border-slate-100 text-[10px]">
                      {ploIdx + 1}.{piIdx + 1}
                    </th>
                  ))
                ))}
              </tr>
            </thead>
            <tbody>
              {peos.map((_, peoIdx) => (
                <tr key={peoIdx}>
                  <td className="p-3 border-b border-r border-slate-100 font-bold text-slate-600 bg-slate-50/30">
                    PEO{peoIdx + 1}
                  </td>
                  {plos.map((plo, ploIdx) => (
                    plo.pis.map((_, piIdx) => (
                      <td key={`${ploIdx}-${piIdx}`} className="p-2 text-center border-b border-r border-slate-100">
                        <Checkbox
                          checked={matrix[peoIdx]?.[ploIdx]?.[piIdx]}
                          onChange={() => toggleMatrix(peoIdx, ploIdx, piIdx)}
                          disabled={readonly}
                        />
                      </td>
                    ))
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// --- S5_CLO Renderer ---
function S5CLORenderer({ step, readonly }: { step: any; readonly: boolean }) {
  const [tenHocPhan, setTenHocPhan] = useState('');
  const [cloList, setCloList] = useState([
    { ma: 'CLO1', noiDung: '', plo: 'PLO1', mucDo: '3' }
  ]);
  const [noiDungChiTiet, setNoiDungChiTiet] = useState('');

  const addClo = () => setCloList([...cloList, { ma: `CLO${cloList.length + 1}`, noiDung: '', plo: 'PLO1', mucDo: '3' }]);

  const columns = [
    { title: 'Mã CLO', dataIndex: 'ma', key: 'ma', width: 100, render: (text: string, _: any, idx: number) => (
      <Input value={text} size="small" disabled={readonly} onChange={e => {
        const next = [...cloList];
        next[idx].ma = e.target.value;
        setCloList(next);
      }} />
    )},
    { title: 'Nội dung chuẩn đầu ra học phần', dataIndex: 'noiDung', key: 'noiDung', render: (text: string, _: any, idx: number) => (
      <Input.TextArea value={text} autoSize size="small" disabled={readonly} placeholder="Nhập nội dung CLO..." onChange={e => {
        const next = [...cloList];
        next[idx].noiDung = e.target.value;
        setCloList(next);
      }} />
    )},
    { title: 'PLO liên kết', dataIndex: 'plo', key: 'plo', width: 120, render: (text: string, _: any, idx: number) => (
      <Input value={text} size="small" disabled={readonly} onChange={e => {
        const next = [...cloList];
        next[idx].plo = e.target.value;
        setCloList(next);
      }} />
    )},
    { title: 'Mức độ', dataIndex: 'mucDo', key: 'mucDo', width: 100, render: (text: string, _: any, idx: number) => (
      <Input value={text} size="small" disabled={readonly} onChange={e => {
        const next = [...cloList];
        next[idx].mucDo = e.target.value;
        setCloList(next);
      }} />
    )},
    !readonly && {
      title: '',
      key: 'action',
      width: 50,
      render: (_: any, __: any, idx: number) => (
        <Button type="text" danger icon={<Trash2 size={14} />} onClick={() => setCloList(cloList.filter((_, i) => i !== idx))} />
      )
    }
  ].filter(Boolean) as any[];

  return (
    <div className="space-y-6">
      <section>
        <label className="block text-sm font-bold text-slate-700 mb-2">Tên học phần</label>
        <Input
          value={tenHocPhan}
          onChange={e => setTenHocPhan(e.target.value)}
          placeholder="Ví dụ: Lập trình hướng đối tượng"
          className="h-11 rounded-xl"
          disabled={readonly}
        />
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-bold text-slate-700">Danh sách Chuẩn đầu ra học phần (CLO)</label>
          {!readonly && <Button type="primary" size="small" icon={<Plus size={14} />} onClick={addClo}>Thêm CLO</Button>}
        </div>
        <Table
          dataSource={cloList}
          columns={columns}
          pagination={false}
          size="small"
          bordered
          className="rounded-xl overflow-hidden"
          rowKey={(record, idx) => idx?.toString() || ''}
        />
      </section>

      <section>
        <label className="block text-sm font-bold text-slate-700 mb-2">Nội dung chi tiết</label>
        <Input.TextArea
          value={noiDungChiTiet}
          onChange={e => setNoiDungChiTiet(e.target.value)}
          placeholder="Nhập nội dung chi tiết của học phần..."
          autoSize={{ minRows: 6 }}
          className="rounded-xl p-4"
          disabled={readonly}
        />
      </section>
    </div>
  );
}

// --- S6_MATRIX Renderer ---
function S6MatrixRenderer({ step, readonly }: { step: any; readonly: boolean }) {
  // Logic from old code: renders a matrix PLO vs CLO
  // Mocking some data for now
  const plos = ['PLO1', 'PLO2', 'PLO3', 'PLO4', 'PLO5'];
  const clos = ['CLO1', 'CLO2', 'CLO3', 'CLO4', 'CLO5'];
  const [matrixData, setMatrixData] = useState<Record<string, Record<string, string>>>({});

  const updateVal = (plo: string, clo: string, val: string) => {
    const next = { ...matrixData };
    if (!next[plo]) next[plo] = {};
    next[plo][clo] = val;
    setMatrixData(next);
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
        <Info className="text-amber-500 shrink-0" size={20} />
        <Text className="text-amber-800 text-sm">
          Ma trận thể hiện mức độ đóng góp của các Chuẩn đầu ra học phần (CLO) vào Chuẩn đầu ra chương trình (PLO).
          Nhập mức độ (ví dụ: 1, 2, 3 hoặc L, M, H) vào các ô tương ứng.
        </Text>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-sm border-collapse bg-white">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left border-b border-r border-slate-100 font-bold text-slate-500">PLO \ CLO</th>
              {clos.map(clo => (
                <th key={clo} className="p-3 text-center border-b border-r border-slate-100 font-bold text-slate-500">{clo}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plos.map(plo => (
              <tr key={plo}>
                <td className="p-3 border-b border-r border-slate-100 font-bold text-slate-700 bg-slate-50/30">{plo}</td>
                {clos.map(clo => (
                  <td key={clo} className="p-1 border-b border-r border-slate-100 text-center">
                    <Input
                      value={matrixData[plo]?.[clo] || ''}
                      onChange={e => updateVal(plo, clo, e.target.value)}
                      className="w-12 h-9 text-center border-none hover:bg-slate-50 focus:bg-white"
                      disabled={readonly}
                      placeholder="-"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
