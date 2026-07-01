import React from 'react';
import { Clock, CheckCircle2, Package, Truck, Compass, MapPin } from 'lucide-react';

interface LogisticsTimelineProps {
  order: {
    id: string;
    date: string;
    status: string;
    carrier?: string;
    trackingNumber?: string;
  };
}

export const LogisticsTimeline: React.FC<LogisticsTimelineProps> = ({ order }) => {
  const getTimelineEvents = () => {
    const events: Array<{
      title: string;
      desc: string;
      dateStr: string;
      icon: React.ReactNode;
      color: string;
      active: boolean;
    }> = [];

    const orderDateObj = new Date(order.date);
    const formatDate = (daysToAdd: number, hourStr: string) => {
      const d = new Date(orderDateObj);
      d.setDate(d.getDate() + daysToAdd);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day} ${hourStr}`;
    };

    // 1. Order Placed
    events.push({
      title: "订单已提交 / Order Submitted",
      desc: "客户下单成功，系统已接收并验证秘宝订单，付款授权已完成。",
      dateStr: formatDate(0, "10:15:22"),
      icon: <Clock size={14} />,
      color: "text-blue-500 bg-blue-50 border-blue-200",
      active: true
    });

    // 2. Processing / Production
    const inProductionOrShipped = order.status === 'In Production' || order.status === 'Shipped';
    events.push({
      title: "产品正在定制中 / In Customization",
      desc: "工坊工艺组已接单。根据您的定制参数，专属玄学制品正在刻印、成型与出厂校验中。",
      dateStr: formatDate(0, "14:30:00"),
      icon: <Compass size={14} className={inProductionOrShipped ? "animate-spin" : ""} />,
      color: inProductionOrShipped ? "text-amber-500 bg-amber-50 border-amber-200" : "text-neutral-400 bg-neutral-50 border-neutral-100",
      active: inProductionOrShipped
    });

    // 3. Sanitized Packaging
    const isShipped = order.status === 'Shipped';
    events.push({
      title: "已完成质检与安全包装 / Passed Quality Control & Packaged",
      desc: "定制工艺完成，通过严苛的玄学与物理属性多维度质量复检。包裹已装入无菌特制防护箱并贴上防伪运单。",
      dateStr: formatDate(1, "11:20:00"),
      icon: <Package size={14} />,
      color: isShipped ? "text-indigo-500 bg-indigo-50 border-indigo-200" : "text-neutral-400 bg-neutral-50 border-neutral-100",
      active: isShipped
    });

    // 4. Dispatched / Handed over to Carrier
    const carrierName = order.carrier || "DHL Express";
    const trackCode = order.trackingNumber || "N/A";
    events.push({
      title: `快递揽收成功 / Picked up by ${carrierName}`,
      desc: `包裹已被国际航空物流承运商 [${carrierName}] 揽收，物流跟踪编号: ${trackCode}。`,
      dateStr: formatDate(1, "16:45:00"),
      icon: <Truck size={14} />,
      color: isShipped ? "text-emerald-500 bg-emerald-50 border-emerald-200" : "text-neutral-400 bg-neutral-50 border-neutral-100",
      active: isShipped
    });

    // 5. In Transit
    events.push({
      title: "物流运送中 / Package In Transit",
      desc: "包裹已经过出口口岸完成清关手续，正搭乘航空货运班机飞往目的地国家/地区。",
      dateStr: formatDate(2, "08:50:00"),
      icon: <Compass size={14} />,
      color: isShipped ? "text-emerald-500 bg-emerald-50 border-emerald-200" : "text-neutral-400 bg-neutral-50 border-neutral-100",
      active: isShipped
    });

    // 6. Delivered (If shipped and date is older than 2 days)
    const isDelivered = isShipped && (Date.now() - orderDateObj.getTime() > 2 * 24 * 60 * 60 * 1000);
    events.push({
      title: "派送完成 / Delivered Successfully",
      desc: "包裹已送达目的地址，由当地派送员派送完毕。客户本人（或指定寄存处）已安全签收，祝您生活愉快！",
      dateStr: isDelivered ? formatDate(3, "15:30:12") : "等待派送中 / Awaiting arrival",
      icon: <MapPin size={14} />,
      color: isDelivered ? "text-emerald-600 bg-emerald-100 border-emerald-300" : "text-neutral-300 bg-neutral-50 border-neutral-100",
      active: isDelivered
    });

    return events;
  };

  const events = getTimelineEvents();

  return (
    <div className="bg-neutral-50 border border-neutral-150 p-5 rounded-2xl space-y-4">
      <h4 className="font-bold text-xs text-neutral-800 uppercase tracking-widest flex items-center gap-1.5">
        <Truck size={14} className="text-emerald-600 animate-bounce" />
        物流轨迹信息及发货状态 / Logistics Trajectory & Fulfilment Details
      </h4>

      <div className="relative pl-6 space-y-5 border-l-2 border-neutral-200 ml-3.5 pt-1">
        {events.map((ev, index) => (
          <div key={index} className={`relative ${ev.active ? 'opacity-100' : 'opacity-50'}`}>
            {/* Circle Node */}
            <div className={`absolute -left-[31px] top-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-xs transition-all ${ev.color}`}>
              {ev.icon}
            </div>

            {/* Event Content */}
            <div className="space-y-1">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <span className={`text-xs font-bold ${ev.active ? 'text-neutral-900' : 'text-neutral-450'}`}>
                  {ev.title}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono font-medium">
                  {ev.dateStr}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 leading-relaxed font-medium">
                {ev.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
