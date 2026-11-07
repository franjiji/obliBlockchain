import { STATUS } from "../lib/format.js";

export default function Badge({ status }) {
  return <span className={`badge badge-${STATUS[status].toLowerCase()}`}>{STATUS[status]}</span>;
}
