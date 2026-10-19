import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isBetween from "dayjs/plugin/isBetween";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

export const DATE_FORMAT = "DD MMM YYYY";
export const DATE_TIME_FORMAT = "DD MMM YYYY, h:mm A";
export const INPUT_DATETIME_FORMAT = "YYYY-MM-DDTHH:mm";

export const formatDate = (d: Date | string | number | null | undefined, fmt = DATE_FORMAT) =>
  d ? dayjs(d).format(fmt) : "—";
export const formatDateTime = (d: Date | string | number | null | undefined) => formatDate(d, DATE_TIME_FORMAT);
export const fromNow = (d: Date | string | number | null | undefined) => (d ? dayjs(d).fromNow() : "—");
/** Value for <input type="datetime-local"> */
export const toInputDateTime = (d: Date | string | null | undefined) => (d ? dayjs(d).format(INPUT_DATETIME_FORMAT) : "");

export { dayjs };
