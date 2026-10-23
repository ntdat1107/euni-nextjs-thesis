'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import {
  Table,
  Button,
  Card,
  Input,
  Select,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  App,
  Tooltip,
  Breadcrumb
} from 'antd';
import {
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Layers
} from 'lucide-react';
import { usePrograms } from '@/hooks/usePrograms';
import { useMajors } from '@/hooks/useMajors';
import { Program } from '@/types/academic';

const { Title, Text } = Typography;

export default function CurriculumProgramsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryId = searchParams.get('id');
  const initialMajorId = searchParams.get('majorId') || undefined;

  const { modal } = App.useApp();
  const { programs = [], isLoading: loadingPrograms, deleteProgram } = usePrograms();
  const { majors = [], isLoading: loadingMajors } = useMajors();

  const [selectedMajorId, setSelectedMajorId] = useState<number | string | undefined>(initialMajorId);
  const [searchText, setSearchText] = useState('');

  // Backward compatibility: If accessed via ?id=xxx, forward directly to the dedicated detail URL
  useEffect(() => {
    if (queryId) {
      router.replace(`/curriculum/programs/${queryId}`);
    }
  }, [queryId, router]);

  const filteredPrograms = useMemo(() => {
    return programs.filter(p => {
      const matchMajor = selectedMajorId ? p.majorId === Number(selectedMajorId) : true;
      const matchSearch = searchText 
        ? p.name.toLowerCase().includes(searchText.toLowerCase()) || 
          p.code.toLowerCase().includes(searchText.toLowerCase())
        : true;
      return matchMajor && matchSearch;
    });
  }, [programs, selectedMajorId, searchText]);

  const handleDelete = (program: Program) => {
    if (program.status !== 'DRAFT') {
      return;
    }
    if (program.hasUncompletedCampaign) {
      return;
    }
    modal.confirm({
      title: 'Xác nhận xóa chương trình đào tạo?',
      content: `Bạn có chắc chắn muốn xóa chương trình "${program.name}" (${program.code})? Hành động này không thể hoàn tác.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      centered: true,
      onOk: () => {
        deleteProgram(program.id);
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            Đã ban hành
          </div>
        );
      case 'DRAFT':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            Bản nháp
          </div>
        );
      case 'INACTIVE':
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
            Ngừng áp dụng
          </div>
        );
    }
  };

  const columns = [
    {
      title: 'Mã CTĐT',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      render: (code: string) => (
        <code className="bg-slate-100 text-slate-700 font-mono text-xs px-2.5 py-1 rounded-lg border border-slate-200/80 font-bold">
          {code}
        </code>
      ),
    },
    {
      title: 'Tên chương trình đào tạo',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Program) => (
        <div>
          <a
            onClick={() => router.push(`/curriculum/programs/${record.id}`)}
            className="font-bold text-slate-800 text-sm hover:text-blue-600 cursor-pointer transition-colors block"
          >
            {text}
          </a>
          {record.description && (
            <span className="text-slate-400 text-xs line-clamp-1 mt-0.5">
              {record.description}
            </span>
          )}
        </div>
      ),
    },
    {
      title: 'Ngành đào tạo',
      dataIndex: 'majorId',
      key: 'majorId',
      width: 240,
      render: (majorId: number) => {
        const major = majors.find(m => m.id === majorId);
        return (
          <span className="text-xs font-semibold text-slate-700">
            {major ? `${major.name} (${major.code})` : '---'}
          </span>
        );
      },
    },
    {
      title: 'Trình độ / Hình thức',
      key: 'trainingInfo',
      width: 200,
      render: (_: any, record: Program) => {
        const levelText = record.degreeLevel === 'MASTER' ? 'Thạc sĩ' : (record.degreeLevel === 'DOCTOR' ? 'Tiến sĩ' : 'Đại học');
        const modeText = record.trainingMode === 'PART_TIME' ? 'Vừa làm vừa học' : (record.trainingMode === 'DISTANCE' ? 'Từ xa' : 'Chính quy');
        return (
          <div className="flex flex-col text-xs font-medium">
            <span className="text-slate-800 font-semibold">{levelText}</span>
            <span className="text-slate-400">{modeText} &bull; {record.totalCredits ? `${record.totalCredits} TC` : ''}</span>
          </div>
        );
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status: string) => getStatusBadge(status),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 110,
      align: 'right' as const,
      render: (_: any, record: Program) => {
        const isDraft = record.status === 'DRAFT';
        const hasUncompleted = !!record.hasUncompletedCampaign;
        const canDelete = isDraft && !hasUncompleted;

        let deleteTooltip = 'Xóa chương trình';
        if (hasUncompleted) {
          deleteTooltip = 'Chương trình đang có đợt khảo sát/xây dựng chưa hoàn thành (Không thể xóa)';
        } else if (!isDraft) {
          deleteTooltip = 'Chỉ được phép xóa chương trình ở trạng thái Bản nháp';
        }

        return (
          <Space>
            <Tooltip title="Xem chi tiết & Cấu trúc khối kiến thức">
              <Button
                type="text"
                icon={<Eye className="w-4 h-4 text-blue-600" />}
                onClick={() => router.push(`/curriculum/programs/${record.id}`)}
                className="hover:bg-blue-50 rounded-lg cursor-pointer"
              />
            </Tooltip>
            <Tooltip title={deleteTooltip}>
              <Button
                type="text"
                danger
                disabled={!canDelete}
                icon={<Trash2 className="w-4 h-4" />}
                onClick={() => handleDelete(record)}
                className="hover:bg-rose-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* 1. Breadcrumb Standard */}
        <Breadcrumb
          className="text-slate-400 text-xs"
          items={[
            { title: <a onClick={() => router.push('/')} className="hover:text-blue-600 cursor-pointer">Trang chủ</a> },
            { title: <span className="text-slate-600 font-medium">Đào tạo</span> },
            { title: 'Chương trình đào tạo' }
          ]}
        />

        {/* 2. Header Card Standard */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Title level={2} className="!mb-0 !text-slate-800 tracking-tight font-bold text-2xl">
                Quản lý Chương trình Đào tạo
              </Title>
            </div>
            <Text className="text-slate-500 font-medium text-xs mt-1 block">
              Danh mục các chương trình đào tạo, Cây cấu trúc khối kiến thức (TT 17) và Khung học phần viện trường.
            </Text>
          </div>

          <Button
            type="primary"
            icon={<Plus className="w-5 h-5" />}
            onClick={() => router.push('/curriculum/programs/new')}
            className="h-10 px-6 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100 border-none transition-all flex items-center gap-2 cursor-pointer"
          >
            Tạo chương trình
          </Button>
        </div>

        {/* 4 Thẻ chỉ số thống kê */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card className="rounded-2xl border border-slate-200/90 shadow-2xs bg-white">
              <Statistic
                title={<span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Tổng số CTĐT</span>}
                value={programs.length}
                formatter={(val) => <span className="font-outfit font-extrabold text-slate-800">{val}</span>}
                prefix={<FileText className="w-4 h-4 text-blue-500 mr-2" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="rounded-2xl border border-slate-200/90 shadow-2xs bg-white">
              <Statistic
                title={<span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Đã ban hành (Áp dụng)</span>}
                value={programs.filter(p => p.status === 'ACTIVE').length}
                formatter={(val) => <span className="font-outfit font-extrabold text-emerald-600">{val}</span>}
                prefix={<CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="rounded-2xl border border-slate-200/90 shadow-2xs bg-white">
              <Statistic
                title={<span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Bản nháp (Đang xây dựng)</span>}
                value={programs.filter(p => p.status === 'DRAFT').length}
                formatter={(val) => <span className="font-outfit font-extrabold text-amber-600">{val}</span>}
                prefix={<Clock className="w-4 h-4 text-amber-500 mr-2" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="rounded-2xl border border-slate-200/90 shadow-2xs bg-white">
              <Statistic
                title={<span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Đang khảo sát rà soát</span>}
                value={programs.filter(p => p.hasUncompletedCampaign).length}
                formatter={(val) => <span className="font-outfit font-extrabold text-blue-600">{val}</span>}
                prefix={<AlertTriangle className="w-4 h-4 text-blue-500 mr-2" />}
              />
            </Card>
          </Col>
        </Row>

        {/* Table Card Section */}
        <Card className="rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden" styles={{ body: { padding: 0 } }}>
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white/50 gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-1 flex-wrap">
              <Input
                placeholder="Tìm kiếm theo tên hoặc mã chương trình..."
                prefix={<Search className="w-4 h-4 text-slate-400" />}
                className="max-w-md rounded-xl h-10"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                allowClear
              />
              <Select
                placeholder="Lọc theo ngành học"
                className="w-64 rounded-xl h-10"
                allowClear
                value={selectedMajorId}
                onChange={setSelectedMajorId}
              >
                {majors.map(m => (
                  <Select.Option key={m.id} value={m.id}>{m.name} ({m.code})</Select.Option>
                ))}
              </Select>
            </div>
          </div>
          <Table
            loading={loadingPrograms || loadingMajors}
            dataSource={filteredPrograms}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              className: "px-6 py-3"
            }}
            className="ant-table-custom"
            onRow={(record) => ({
              onClick: () => router.push(`/curriculum/programs/${record.id}`),
              className: 'cursor-pointer hover:bg-slate-50/80 transition-colors'
            })}
          />
        </Card>
      </div>
    </AppShell>
  );
}
