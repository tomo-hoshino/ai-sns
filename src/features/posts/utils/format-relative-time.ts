import { formatDistance } from "date-fns";
import { ja } from "date-fns/locale";

/**
 * ISO 8601日時をブラウザ／実行環境のローカル基準で相対表示する。
 * `now` を渡せるようにし、テストで時刻を固定できるようにする。
 */
export function formatRelativeTime(
  isoDateTime: string,
  now: Date = new Date(),
): string {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) {
    return "日時不明";
  }

  return formatDistance(date, now, {
    addSuffix: true,
    locale: ja,
  });
}
