/* ============================================================
   Traveller — Blocchi UI della sezione Money
   Composti con i token di global/designSystem e le primitive di
   components/ui: qui non si hardcodano colori, spazi o font.
   ============================================================ */

import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ds } from "../../global/designSystem";
import { InitialsAvatar, ProgressTrack, StatusBadge } from "../ui";
import SkeletonScreen from "../SkeletonScreen";
import { money, personName, relativeDate, signedMoney } from "./format";
import {
  MoneyBalance,
  MoneyMonthPoint,
  MoneyMovement,
  MoneyTravelRow,
  MoneyTab,
  MovementFilter,
} from "./types";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

/* ============================================================
   Hero dell'header: saldo netto
   La cifra che conta davvero — "sono in credito o in debito?" —
   prima non esisteva in nessun punto dell'app.
   ============================================================ */

interface MoneyHeroProps {
  net: number;
  toReceive: number;
  toPay: number;
  loading: boolean;
}

export function MoneyHero({ net, toReceive, toPay, loading }: MoneyHeroProps) {
  const settled = Math.abs(net) < 0.01;
  const positive = net > 0;

  const caption = settled
    ? "Sei in pari con tutti"
    : positive
      ? "Sei in credito"
      : "Hai debiti aperti";

  return (
    <View>
      <View style={styles.heroTopRow}>
        <Text style={styles.heroTitle}>Money</Text>
        <View style={styles.heroStatus}>
          <MaterialCommunityIcons
            name={settled ? "check-circle-outline" : positive ? "trending-up" : "trending-down"}
            size={13}
            color={ds.colors.white}
          />
          <Text style={styles.heroStatusText}>{caption}</Text>
        </View>
      </View>

      <Text style={styles.heroLabel}>Saldo netto</Text>
      {loading ? (
        <SkeletonScreen width={180} height={38} borderRadius={ds.radius.m} style={styles.heroSkeleton} />
      ) : (
        <Text style={styles.heroAmount}>{settled ? money(0) : signedMoney(net)}</Text>
      )}

      <View style={styles.heroSplit}>
        <HeroStat
          icon="arrow-down-circle-outline"
          label="Da ricevere"
          value={loading ? null : money(toReceive)}
        />
        <View style={styles.heroDivider} />
        <HeroStat
          icon="arrow-up-circle-outline"
          label="Da pagare"
          value={loading ? null : money(toPay)}
        />
      </View>
    </View>
  );
}

function HeroStat({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string | null;
}) {
  return (
    <View style={styles.heroStat}>
      <View style={styles.heroStatHead}>
        <MaterialCommunityIcons name={icon} size={13} color={ds.colors.onBrandMuted} />
        <Text style={styles.heroStatLabel}>{label}</Text>
      </View>
      {value === null ? (
        <SkeletonScreen width={72} height={17} borderRadius={ds.radius.s} />
      ) : (
        <Text style={styles.heroStatValue}>{value}</Text>
      )}
    </View>
  );
}

/* ============================================================
   Selettore di tab (Panoramica / Saldi / Movimenti)
   ============================================================ */

interface SegmentedTabsProps {
  value: MoneyTab;
  onChange: (tab: MoneyTab) => void;
  /** Pallino numerico opzionale per tab (es. saldi aperti). */
  badges?: Partial<Record<MoneyTab, number>>;
}

const TAB_LABELS: { key: MoneyTab; label: string }[] = [
  { key: "overview", label: "Panoramica" },
  { key: "balances", label: "Saldi" },
  { key: "movements", label: "Movimenti" },
];

export function SegmentedTabs({ value, onChange, badges }: SegmentedTabsProps) {
  return (
    <View style={styles.segmented}>
      {TAB_LABELS.map((tab) => {
        const active = tab.key === value;
        const badge = badges?.[tab.key];

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.segmentedItem}
            activeOpacity={0.8}
            onPress={() => onChange(tab.key)}
          >
            <View style={[styles.segment, active && styles.segmentActive]}>
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {tab.label}
              </Text>
              {badge ? (
                <View style={[styles.segmentBadge, active && styles.segmentBadgeActive]}>
                  <Text style={[styles.segmentBadgeText, active && styles.segmentBadgeTextActive]}>
                    {badge}
                  </Text>
                </View>
              ) : null}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ============================================================
   Card statistica
   ============================================================ */

interface StatCardProps {
  label: string;
  value: string;
  icon: IconName;
  iconBg: string;
  iconColor: string;
  /** Riga di contesto sotto il valore (es. "-12% sul mese scorso"). */
  hint?: string;
  hintTone?: "up" | "down" | "neutral";
  loading?: boolean;
}

export function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  hint,
  hintTone = "neutral",
  loading,
}: StatCardProps) {
  const hintColor =
    hintTone === "up"
      ? ds.colors.errorText
      : hintTone === "down"
        ? ds.colors.successText
        : ds.colors.textSecondary;

  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon} size={14} color={iconColor} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      {loading ? (
        <SkeletonScreen width={"80%"} height={22} borderRadius={ds.radius.s} />
      ) : (
        <Text style={styles.statValue}>{value}</Text>
      )}
      {hint && !loading ? (
        <Text style={[styles.statHint, { color: hintColor }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

/* ============================================================
   Grafico dell'andamento mensile
   12 colonne toccabili: la lettura del valore avviene in alto,
   così le etichette non si accavallano sopra le barre.
   ============================================================ */

const CHART_HEIGHT = 120;

interface TrendChartProps {
  data: MoneyMonthPoint[];
  loading?: boolean;
}

export function TrendChart({ data, loading }: TrendChartProps) {
  // Di default è selezionato il mese corrente (l'ultimo della serie).
  const [selected, setSelected] = React.useState<number | null>(null);
  const index = selected ?? Math.max(0, data.length - 1);
  const point = data[index];

  const max = data.reduce((acc, item) => (item.total > acc ? item.total : acc), 0);
  const empty = max === 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>Andamento spese</Text>
        {!loading && point ? (
          <View style={styles.readout}>
            <Text style={styles.readoutValue}>{money(point.total)}</Text>
            <Text style={styles.readoutLabel}>{point.label}</Text>
          </View>
        ) : null}
      </View>

      {loading ? (
        <SkeletonScreen width={"100%"} height={CHART_HEIGHT} borderRadius={ds.radius.m} />
      ) : (
        <>
          <View style={styles.chart}>
            {data.map((item, i) => {
              const active = i === index;
              const ratio = empty ? 0 : item.total / max;
              // Altezza minima 4px: una barra a zero deve restare visibile
              // come "traccia", altrimenti la colonna sembra mancante.
              const height = Math.max(4, ratio * CHART_HEIGHT);

              return (
                <Pressable
                  key={item.month}
                  style={styles.chartColumn}
                  onPress={() => setSelected(i)}
                  hitSlop={6}
                >
                  <View style={styles.chartBarSlot}>
                    {active && item.total > 0 ? (
                      <LinearGradient
                        colors={[ds.colors.action, ds.colors.brand]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={[styles.chartBar, { height }]}
                      />
                    ) : (
                      <View
                        style={[
                          styles.chartBar,
                          {
                            height,
                            backgroundColor:
                              item.total > 0 ? ds.colors.scale.accent[4] : ds.colors.scale.neutral[3],
                          },
                        ]}
                      />
                    )}
                  </View>
                  <Text style={[styles.chartLabel, active && styles.chartLabelActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {empty ? (
            <Text style={styles.chartEmpty}>Nessuna spesa negli ultimi 12 mesi</Text>
          ) : null}
        </>
      )}
    </View>
  );
}

/* ============================================================
   Spesa per viaggio
   Barre orizzontali invece delle colonne verticali di prima: con
   più di 4-5 viaggi le colonne uscivano dallo schermo e i nomi
   diventavano illeggibili.
   ============================================================ */

interface TravelBreakdownProps {
  data: MoneyTravelRow[];
  loading?: boolean;
  onSelect?: (travel: MoneyTravelRow) => void;
}

export function TravelBreakdown({ data, loading, onSelect }: TravelBreakdownProps) {
  const [expanded, setExpanded] = React.useState(false);
  const max = data.reduce((acc, item) => (item.total > acc ? item.total : acc), 0);
  const visible = expanded ? data : data.slice(0, 4);

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>Spese per viaggio</Text>
        {data.length > 4 ? (
          <TouchableOpacity activeOpacity={0.7} onPress={() => setExpanded((v) => !v)}>
            <Text style={styles.cardAction}>{expanded ? "Riduci" : `Tutti (${data.length})`}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <SkeletonScreen width={"100%"} height={110} borderRadius={ds.radius.m} />
      ) : data.length === 0 ? (
        <Text style={styles.chartEmpty}>Nessuna spesa registrata</Text>
      ) : (
        visible.map((travel) => (
          <TouchableOpacity
            key={travel.travelId}
            activeOpacity={onSelect ? 0.7 : 1}
            disabled={!onSelect}
            onPress={() => onSelect?.(travel)}
          >
            <View style={styles.travelRow}>
              <View style={styles.travelHead}>
                <Text style={styles.travelName} numberOfLines={1}>
                  {travel.name}
                </Text>
                <Text style={styles.travelTotal}>{money(travel.total)}</Text>
              </View>
              <ProgressTrack
                progress={max ? travel.total / max : 0}
                color={travel.closed ? ds.colors.scale.neutral[8] : ds.colors.action}
                height={6}
              />
              <Text style={styles.travelMeta}>
                {travel.count} {travel.count === 1 ? "spesa" : "spese"}
                {travel.pending > 0 ? ` · ${money(travel.pending)} da saldare` : ""}
                {travel.closed ? " · concluso" : ""}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

/* ============================================================
   Riga di saldo con una persona
   ============================================================ */

interface BalanceRowProps {
  balance: MoneyBalance;
  /** true se la persona deve a me: solo in questo caso posso saldare. */
  incoming: boolean;
  busy?: boolean;
  onSettle?: () => void;
  onNudge?: () => void;
  last?: boolean;
}

export function BalanceRow({
  balance,
  incoming,
  busy,
  onSettle,
  onNudge,
  last,
}: BalanceRowProps) {
  const name = personName(balance);
  const amount = Math.abs(balance.net);

  return (
    <View style={[styles.balanceRow, !last && styles.rowDivider]}>
      <InitialsAvatar name={name} size={40} />

      <View style={styles.balanceText}>
        <Text style={styles.balanceName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.balanceMeta}>
          {balance.openCount} {balance.openCount === 1 ? "quota aperta" : "quote aperte"}
          {balance.theyOweMe > 0 && balance.iOweThem > 0
            ? ` · compensate ${money(Math.min(balance.theyOweMe, balance.iOweThem))}`
            : ""}
        </Text>

        <View style={styles.balanceActions}>
          {incoming ? (
            <>
              <TouchableOpacity activeOpacity={0.8} onPress={onSettle} disabled={busy}>
                <View style={[styles.pillPrimary, busy && styles.pillDisabled]}>
                  {busy ? (
                    <ActivityIndicator size="small" color={ds.colors.white} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="check" size={13} color={ds.colors.white} />
                      <Text style={styles.pillPrimaryText}>Salda</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8} onPress={onNudge} disabled={busy}>
                <View style={styles.pillGhost}>
                  <MaterialCommunityIcons
                    name="bell-outline"
                    size={13}
                    color={ds.colors.textSecondary}
                  />
                  <Text style={styles.pillGhostText}>Sollecita</Text>
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity activeOpacity={0.8} onPress={onNudge}>
              <View style={styles.pillGhost}>
                <MaterialCommunityIcons
                  name="send-outline"
                  size={13}
                  color={ds.colors.textSecondary}
                />
                <Text style={styles.pillGhostText}>Avvisa che hai pagato</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text
        style={[
          styles.balanceAmount,
          { color: incoming ? ds.colors.successText : ds.colors.errorText },
        ]}
      >
        {incoming ? "+ " : "− "}
        {money(amount)}
      </Text>
    </View>
  );
}

/* ============================================================
   Riga della lista movimenti
   ============================================================ */

const DIRECTION_STYLE: Record<
  MoneyMovement["direction"],
  { icon: IconName; bg: string; fg: string; sign: string }
> = {
  in: {
    icon: "arrow-down-left",
    bg: ds.colors.successSoft,
    fg: ds.colors.successText,
    sign: "+ ",
  },
  out: {
    icon: "arrow-top-right",
    bg: ds.colors.errorSoft,
    fg: ds.colors.errorText,
    sign: "− ",
  },
  personal: {
    icon: "account-outline",
    bg: ds.colors.actionSubtle,
    fg: ds.colors.action,
    sign: "",
  },
};

interface MovementRowProps {
  movement: MoneyMovement;
  onPress?: () => void;
  last?: boolean;
}

export function MovementRow({ movement, onPress, last }: MovementRowProps) {
  const tone = DIRECTION_STYLE[movement.direction];
  const title =
    movement.description?.trim() ||
    (movement.direction === "personal" ? "Spesa personale" : "Richiesta di pagamento");

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <View style={[styles.movementRow, !last && styles.rowDivider]}>
        <View style={[styles.movementIcon, { backgroundColor: tone.bg }]}>
          <MaterialCommunityIcons name={tone.icon} size={16} color={tone.fg} />
        </View>

        <View style={styles.movementText}>
          <Text style={styles.movementTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.movementMeta} numberOfLines={1}>
            {movement.travelName} · {relativeDate(movement.dateTime)}
          </Text>
        </View>

        <View style={styles.movementRight}>
          <Text style={[styles.movementAmount, { color: tone.fg }]}>
            {tone.sign}
            {money(movement.myShare)}
          </Text>
          {movement.direction === "personal" ? (
            <Text style={styles.movementStatus}>personale</Text>
          ) : movement.settled ? (
            <Text style={styles.movementStatus}>saldato</Text>
          ) : (
            <Text style={[styles.movementStatus, { color: ds.colors.warningText }]}>
              {money(movement.pending)} aperti
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ============================================================
   Filtri della lista movimenti
   ============================================================ */

const FILTERS: { key: MovementFilter; label: string; icon: IconName }[] = [
  { key: "all", label: "Tutti", icon: "format-list-bulleted" },
  { key: "open", label: "Da saldare", icon: "clock-outline" },
  { key: "out", label: "Uscite", icon: "arrow-top-right" },
  { key: "in", label: "Anticipi", icon: "arrow-down-left" },
];

interface FilterBarProps {
  value: MovementFilter;
  onChange: (filter: MovementFilter) => void;
  travels: MoneyTravelRow[];
  travelFilter: string | null;
  onTravelChange: (travelId: string | null) => void;
}

export function FilterBar({
  value,
  onChange,
  travels,
  travelFilter,
  onTravelChange,
}: FilterBarProps) {
  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {FILTERS.map((filter) => {
          const active = filter.key === value;
          return (
            <TouchableOpacity
              key={filter.key}
              activeOpacity={0.8}
              onPress={() => onChange(filter.key)}
            >
              <View style={[styles.filterChip, active && styles.filterChipActive]}>
                <MaterialCommunityIcons
                  name={filter.icon}
                  size={12}
                  color={active ? ds.colors.white : ds.colors.textSecondary}
                />
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {filter.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {travels.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          <TouchableOpacity activeOpacity={0.8} onPress={() => onTravelChange(null)}>
            <View style={[styles.travelChip, !travelFilter && styles.travelChipActive]}>
              <Text
                style={[styles.travelChipText, !travelFilter && styles.travelChipTextActive]}
              >
                Tutti i viaggi
              </Text>
            </View>
          </TouchableOpacity>

          {travels.map((travel) => {
            const active = travelFilter === travel.travelId;
            return (
              <TouchableOpacity
                key={travel.travelId}
                activeOpacity={0.8}
                onPress={() => onTravelChange(active ? null : travel.travelId)}
              >
                <View style={[styles.travelChip, active && styles.travelChipActive]}>
                  <Text
                    style={[styles.travelChipText, active && styles.travelChipTextActive]}
                    numberOfLines={1}
                  >
                    {travel.name}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}
    </>
  );
}

/* ============================================================
   Riepilogo di un movimento (bottom sheet)
   La schermata "Dettagli pagamento" vive nello stack della Home,
   che ha un NavigationContainer indipendente: dal tab Money non è
   raggiungibile via navigation. Questo pannello mostra le stesse
   informazioni senza toccare la struttura di navigazione.
   ============================================================ */

interface MovementDetailProps {
  movement: MoneyMovement;
  onClose: () => void;
}

export function MovementDetail({ movement, onClose }: MovementDetailProps) {
  const tone = DIRECTION_STYLE[movement.direction];
  const totalCost = movement.amount * Math.max(1, movement.peopleCount);

  return (
    <View style={styles.detail}>
      <View style={styles.detailHandle} />

      <View style={styles.detailHead}>
        <View style={[styles.movementIcon, { backgroundColor: tone.bg }]}>
          <MaterialCommunityIcons name={tone.icon} size={16} color={tone.fg} />
        </View>
        <View style={styles.movementText}>
          <Text style={styles.detailTitle} numberOfLines={2}>
            {movement.description?.trim() || "Pagamento"}
          </Text>
          <Text style={styles.movementMeta}>
            {movement.travelName} · {relativeDate(movement.dateTime)}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={10}>
          <MaterialCommunityIcons name="close" size={20} color={ds.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.detailGrid}>
        <DetailCell label="Quota" value={money(movement.amount)} />
        <DetailCell
          label={movement.direction === "in" ? "Anticipato" : "A mio carico"}
          value={money(movement.myShare)}
        />
        <DetailCell
          label="Da saldare"
          value={money(movement.pending)}
          tone={movement.pending > 0 ? ds.colors.warningText : ds.colors.successText}
        />
      </View>

      {movement.direction !== "personal" ? (
        <>
          <View style={styles.detailProgressHead}>
            <Text style={styles.detailProgressLabel}>
              {movement.paidCount} di {movement.peopleCount} hanno saldato
            </Text>
            <StatusBadge
              label={movement.settled ? "Chiuso" : "Aperto"}
              intent={movement.settled ? "success" : "warning"}
            />
          </View>
          <ProgressTrack
            progress={movement.peopleCount ? movement.paidCount / movement.peopleCount : 0}
            color={movement.settled ? ds.colors.success : ds.colors.action}
            height={6}
          />
          <Text style={styles.detailFooter}>
            Totale della spesa {money(totalCost)} · creata da{" "}
            {personName(movement.creator)}
          </Text>
        </>
      ) : (
        <Text style={styles.detailFooter}>
          Spesa personale: non è divisa con nessuno e non genera debiti.
        </Text>
      )}
    </View>
  );
}

function DetailCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <View style={styles.detailCell}>
      <Text style={styles.detailCellLabel}>{label}</Text>
      <Text style={[styles.detailCellValue, tone ? { color: tone } : null]}>{value}</Text>
    </View>
  );
}

/* ============================================================
   Riquadro di errore con "riprova"
   ============================================================ */

export function ErrorNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.errorBox}>
      <MaterialCommunityIcons name="wifi-off" size={20} color={ds.colors.errorText} />
      <Text style={styles.errorText}>{message}</Text>
      <TouchableOpacity activeOpacity={0.8} onPress={onRetry}>
        <View style={styles.errorButton}>
          <Text style={styles.errorButtonText}>Riprova</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

/* ============================================================ */

const styles = StyleSheet.create({
  /* ---- Hero ---- */
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: ds.space[6],
  },
  heroTitle: {
    fontFamily: ds.fontFamily.bold,
    fontSize: 22,
    color: ds.colors.white,
  },
  heroStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[2] + 2,
    backgroundColor: ds.colors.onBrandChipBg,
    borderWidth: 1,
    borderColor: ds.colors.onBrandChipBorder,
    borderRadius: ds.radius.full,
    paddingHorizontal: ds.space[4] - 2,
    paddingVertical: ds.space[2] + 1,
  },
  heroStatusText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 11,
    color: ds.colors.white,
  },
  heroLabel: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: ds.colors.onBrandFaint,
    marginBottom: ds.space[2],
  },
  heroAmount: {
    fontFamily: ds.fontFamily.metaBold,
    fontSize: 38,
    letterSpacing: -0.6,
    color: ds.colors.white,
  },
  heroSkeleton: {
    marginVertical: ds.space[2],
  },
  heroSplit: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: ds.space[5],
  },
  heroDivider: {
    width: 1,
    height: 28,
    backgroundColor: ds.colors.onBrandChipBorder,
    marginHorizontal: ds.space[5],
  },
  heroStat: {
    flex: 1,
  },
  heroStatHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[2],
    marginBottom: ds.space[1],
  },
  heroStatLabel: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 11,
    color: ds.colors.onBrandMuted,
  },
  heroStatValue: {
    fontFamily: ds.fontFamily.metaSemibold,
    fontSize: 15,
    color: ds.colors.white,
  },

  /* ---- Tabs ---- */
  segmented: {
    flexDirection: "row",
    backgroundColor: ds.colors.surfaceSunken,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    borderRadius: ds.radius.m,
    padding: ds.space[1] + 1,
    marginBottom: ds.space[5],
  },
  segmentedItem: {
    flex: 1,
  },
  segment: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ds.space[2],
    height: 32,
    borderRadius: ds.radius.s + 2,
  },
  segmentActive: {
    backgroundColor: ds.colors.surface,
    ...ds.shadow.md,
  },
  segmentText: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 12,
    color: ds.colors.textSecondary,
  },
  segmentTextActive: {
    fontFamily: ds.fontFamily.semibold,
    color: ds.colors.text,
  },
  segmentBadge: {
    minWidth: 16,
    height: 16,
    paddingHorizontal: ds.space[2] - 1,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.scale.neutral[4],
    alignItems: "center",
    justifyContent: "center",
  },
  segmentBadgeActive: {
    backgroundColor: ds.colors.action,
  },
  segmentBadgeText: {
    fontFamily: ds.fontFamily.metaSemibold,
    fontSize: 9,
    color: ds.colors.textSecondary,
  },
  segmentBadgeTextActive: {
    color: ds.colors.white,
  },

  /* ---- Card generica ---- */
  card: {
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    borderRadius: ds.radius.l,
    backgroundColor: ds.colors.surface,
    padding: ds.space[5] - 2,
    marginBottom: ds.space[4],
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: ds.space[5],
  },
  cardTitle: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 14,
    color: ds.colors.text,
  },
  cardAction: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 12,
    color: ds.colors.action,
  },

  /* ---- Stat card ---- */
  statCard: {
    width: "48.5%",
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    borderRadius: ds.radius.l,
    padding: ds.space[5] - 2,
    marginBottom: ds.space[4],
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: ds.radius.m,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: ds.space[4],
  },
  statLabel: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 11,
    color: ds.colors.textSecondary,
    marginBottom: ds.space[3],
  },
  statValue: {
    fontFamily: ds.fontFamily.metaBold,
    fontSize: 19,
    color: ds.colors.text,
  },
  statHint: {
    fontFamily: ds.fontFamily.metaMedium,
    fontSize: 10,
    marginTop: ds.space[2],
  },

  /* ---- Grafico ---- */
  readout: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: ds.space[2],
  },
  readoutValue: {
    fontFamily: ds.fontFamily.metaBold,
    fontSize: 14,
    color: ds.colors.text,
  },
  readoutLabel: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 11,
    color: ds.colors.textSecondary,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  chartColumn: {
    flex: 1,
    alignItems: "center",
  },
  chartBarSlot: {
    height: CHART_HEIGHT,
    justifyContent: "flex-end",
    width: "100%",
    alignItems: "center",
  },
  chartBar: {
    width: "62%",
    minWidth: 10,
    borderRadius: ds.radius.s,
  },
  chartLabel: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 9,
    color: ds.colors.textPlaceholder,
    marginTop: ds.space[3],
  },
  chartLabelActive: {
    fontFamily: ds.fontFamily.semibold,
    color: ds.colors.text,
  },
  chartEmpty: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 12,
    color: ds.colors.textSecondary,
    textAlign: "center",
    paddingVertical: ds.space[4],
  },

  /* ---- Spesa per viaggio ---- */
  travelRow: {
    marginBottom: ds.space[5],
  },
  travelHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: ds.space[3],
  },
  travelName: {
    flex: 1,
    fontFamily: ds.fontFamily.medium,
    fontSize: 13,
    color: ds.colors.text,
    marginRight: ds.space[3],
  },
  travelTotal: {
    fontFamily: ds.fontFamily.metaSemibold,
    fontSize: 13,
    color: ds.colors.text,
  },
  travelMeta: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 10,
    color: ds.colors.textSecondary,
    marginTop: ds.space[2] + 1,
  },

  /* ---- Righe elenco ---- */
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.borderSubtle,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: ds.space[4] - 1,
    paddingVertical: ds.space[4],
    paddingHorizontal: ds.space[4] + 2,
  },
  balanceText: {
    flex: 1,
  },
  balanceName: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.text,
  },
  balanceMeta: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 11,
    color: ds.colors.textSecondary,
    marginTop: 1,
  },
  balanceActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: ds.space[3] - 2,
    marginTop: ds.space[3] + 2,
  },
  balanceAmount: {
    fontFamily: ds.fontFamily.metaBold,
    fontSize: 15,
  },
  pillPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ds.space[2],
    minWidth: 74,
    height: 28,
    paddingHorizontal: ds.space[4] - 2,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.action,
  },
  pillDisabled: {
    backgroundColor: ds.colors.disabledBg,
  },
  pillPrimaryText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 11,
    color: ds.colors.white,
  },
  pillGhost: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[2],
    height: 28,
    paddingHorizontal: ds.space[4] - 2,
    borderRadius: ds.radius.full,
    borderWidth: 1,
    borderColor: ds.colors.border,
  },
  pillGhostText: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 11,
    color: ds.colors.textSecondary,
  },

  movementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[4] - 1,
    paddingVertical: ds.space[4],
    paddingHorizontal: ds.space[4] + 2,
  },
  movementIcon: {
    width: 36,
    height: 36,
    borderRadius: ds.radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  movementText: {
    flex: 1,
  },
  movementTitle: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.text,
  },
  movementMeta: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 11,
    color: ds.colors.textSecondary,
    marginTop: 1,
  },
  movementRight: {
    alignItems: "flex-end",
  },
  movementAmount: {
    fontFamily: ds.fontFamily.metaBold,
    fontSize: 14,
  },
  movementStatus: {
    fontFamily: ds.fontFamily.metaMedium,
    fontSize: 10,
    color: ds.colors.textPlaceholder,
    marginTop: 2,
  },

  /* ---- Filtri ---- */
  chipRow: {
    gap: ds.space[3] - 2,
    paddingBottom: ds.space[4] - 2,
    paddingRight: ds.space[3],
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[2],
    height: 30,
    paddingHorizontal: ds.space[4],
    borderRadius: ds.radius.full,
    borderWidth: 1,
    borderColor: ds.colors.border,
    backgroundColor: ds.colors.surface,
  },
  filterChipActive: {
    backgroundColor: ds.colors.action,
    borderColor: ds.colors.action,
  },
  filterChipText: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 11,
    color: ds.colors.textSecondary,
  },
  filterChipTextActive: {
    fontFamily: ds.fontFamily.semibold,
    color: ds.colors.white,
  },
  travelChip: {
    maxWidth: 150,
    height: 28,
    justifyContent: "center",
    paddingHorizontal: ds.space[4] - 2,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.surfaceSunken,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
  },
  travelChipActive: {
    backgroundColor: ds.colors.actionSubtle,
    borderColor: ds.colors.scale.accent[6],
  },
  travelChipText: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 11,
    color: ds.colors.textSecondary,
  },
  travelChipTextActive: {
    fontFamily: ds.fontFamily.semibold,
    color: ds.colors.action,
  },

  /* ---- Dettaglio movimento ---- */
  detail: {
    backgroundColor: ds.colors.surface,
    borderTopLeftRadius: ds.radius["2xl"],
    borderTopRightRadius: ds.radius["2xl"],
    paddingHorizontal: ds.space[5],
    paddingTop: ds.space[4],
    paddingBottom: ds.space[8],
  },
  detailHandle: {
    alignSelf: "center",
    width: 38,
    height: 4,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.scale.neutral[5],
    marginBottom: ds.space[5],
  },
  detailHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[4] - 1,
    marginBottom: ds.space[6],
  },
  detailTitle: {
    fontFamily: ds.fontFamily.bold,
    fontSize: 15,
    color: ds.colors.text,
  },
  detailGrid: {
    flexDirection: "row",
    gap: ds.space[3] - 2,
    marginBottom: ds.space[6],
  },
  detailCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    borderRadius: ds.radius.l,
    paddingVertical: ds.space[4],
    paddingHorizontal: ds.space[3],
    alignItems: "center",
  },
  detailCellLabel: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 10,
    color: ds.colors.textSecondary,
    marginBottom: ds.space[2] + 2,
    textAlign: "center",
  },
  detailCellValue: {
    fontFamily: ds.fontFamily.metaBold,
    fontSize: 14,
    color: ds.colors.text,
  },
  detailProgressHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: ds.space[3],
  },
  detailProgressLabel: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 12,
    color: ds.colors.textSecondary,
  },
  detailFooter: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 11,
    lineHeight: 16,
    color: ds.colors.textSecondary,
    marginTop: ds.space[4],
  },

  /* ---- Errore ---- */
  errorBox: {
    alignItems: "center",
    gap: ds.space[3],
    borderWidth: 1,
    borderColor: ds.colors.scale.error[3],
    backgroundColor: ds.colors.errorSoft,
    borderRadius: ds.radius.l,
    padding: ds.space[5],
    marginBottom: ds.space[5],
  },
  errorText: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 12,
    lineHeight: 17,
    color: ds.colors.errorText,
    textAlign: "center",
  },
  errorButton: {
    height: 30,
    paddingHorizontal: ds.space[5],
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  errorButtonText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 12,
    color: ds.colors.errorText,
  },
});
