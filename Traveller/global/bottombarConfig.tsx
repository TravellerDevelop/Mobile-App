import { ds } from "./designSystem";

/* Icone della tab bar (Material Community Icons), stato attivo e non attivo */
export const iconConfig: any = {
    Home: { active: "home-variant", inactive: "home-variant-outline", label: "Home" },
    Tickets: { active: "ticket-confirmation", inactive: "ticket-confirmation-outline", label: "Biglietti" },
    Money: { active: "wallet", inactive: "wallet-outline", label: "Money" },
    Travels: { active: "airplane", inactive: "airplane", label: "Viaggi" },
    Settings: { active: "account", inactive: "account-outline", label: "Profilo" },
};

/* Pillola flottante centrata in basso (design PierTour) */
export const tabBarStyle: any = {
    flexDirection: "row",
    position: "absolute",
    left: "50%",
    marginLeft: -(ds.layout.tabBarWidth / 2),
    bottom: ds.layout.tabBarBottom,
    width: ds.layout.tabBarWidth,
    height: ds.layout.tabBarHeight,
    paddingTop: 0,
    paddingBottom: 0,
    borderTopWidth: 0,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.brand,
    alignItems: "center",
    justifyContent: "space-evenly",
    ...ds.shadow.lg,
};

export const tabItemStyle: any = {
    alignItems: "center",
    justifyContent: "center",
};

export const tabLabelStyle: any = {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 9,
    color: ds.colors.white,
    marginTop: 2,
};

export const tabColors = {
    active: ds.colors.white,
    inactive: ds.colors.onBrandFaint,
};
