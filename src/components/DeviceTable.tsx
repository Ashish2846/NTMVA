import type { NetworkDevice } from "../types/domain";
import { riskBand } from "../utils/format";
import { SeverityBadge } from "./SeverityBadge";

export function DeviceTable({
  devices,
  selectedId,
  onSelect
}: {
  devices: NetworkDevice[];
  selectedId?: string;
  onSelect: (device: NetworkDevice) => void;
}): JSX.Element {
  return (
    <section className="panel device-table-panel">
      <header className="panel-header tight">
        <div>
          <p className="eyebrow">Inventory</p>
          <h2>Devices</h2>
        </div>
        <span>{devices.length} rows</span>
      </header>
      <div className="table-scroll">
        <table className="device-table">
          <thead>
            <tr>
              <th>Host</th>
              <th>OS</th>
              <th>Vendor</th>
              <th>Ports</th>
              <th>Risk</th>
              <th>Findings</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr
                className={selectedId === device.id ? "selected" : ""}
                key={device.id}
                onClick={() => onSelect(device)}
              >
                <td>
                  <strong>{device.hostname}</strong>
                  <span>{device.ip}</span>
                </td>
                <td>{device.os}</td>
                <td>{device.vendor}</td>
                <td>{device.ports.filter((port) => port.state === "open").length}</td>
                <td>
                  <SeverityBadge severity={riskBand(device.riskScore)} />
                  <b>{device.riskScore}</b>
                </td>
                <td>{device.vulnerabilities.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
