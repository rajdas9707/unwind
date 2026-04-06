import React, { useState, useRef, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  Animated,
  ScrollView,
} from "react-native";
import {
  Feather,
  MaterialIcons,
  Ionicons,
  FontAwesome5,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DocCardList from "../components/document/docCard";
import { useRouter } from "expo-router";
import UploadDocModal from "../components/document/UploadDocModal";
import FilterModal from "../components/document/FilterModal";
import { getDocuments } from "../storage/document/db";
import { CATEGORIES } from "../utils/categories";

const { width } = Dimensions.get("window");
const CARD_MARGIN = 12;
const CARD_SIZE = (width - CARD_MARGIN * 3 - 40) / 2;

// Typography scale used across this screen
const TYPO = {
  headerTitle: 34,
  headerSubtitle: 14,
  search: 16,
  tab: 13,
  cardTitle: 17,
  cardMeta: 12,
};

export default function Document() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [fabOpen, setFabOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [docs, setDocs] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [sortBy, setSortBy] = useState("name"); // name, date, size
  const [sortOrder, setSortOrder] = useState("asc"); // asc, desc
  const fabAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadDocs();
  }, []);

  // subtle pulsing animation for the title icon to make the page feel alive
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const loadDocs = async () => {
    try {
      const data = await getDocuments();
      setDocs(data || []);
      applyFilters(data || [], query, activeTab);
    } catch (error) {
      console.log("error loading documents", error);
    }
  };

  // Search and filter logic
  const applyFilters = (docsList, searchQuery, category) => {
    let filtered = [...docsList];

    // Apply category filter
    if (category !== "All") {
      filtered = filtered.filter(
        (doc) => doc.tag?.toLowerCase() === category.toLowerCase()
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((doc) => {
        const nameMatch = doc.docName?.toLowerCase().includes(query);
        const tagMatch = doc.tag?.toLowerCase().includes(query);
        const filesMatch = doc.files?.some((file) =>
          file.name?.toLowerCase().includes(query)
        );
        return nameMatch || tagMatch || filesMatch;
      });
    }

    // Apply sorting
    filtered = sortDocuments(filtered);

    setFilteredDocs(filtered);
  };

  const sortDocuments = (docsList) => {
    return [...docsList].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "name":
          aValue = a.docName?.toLowerCase() || "";
          bValue = b.docName?.toLowerCase() || "";
          break;
        case "date":
          aValue = new Date(a.lastOpenedAt || a.createdAt || 0);
          bValue = new Date(b.lastOpenedAt || b.createdAt || 0);
          break;
        case "size":
          aValue = (a.files || []).length;
          bValue = (b.files || []).length;
          break;
        default:
          return 0;
      }

      if (sortBy === "date") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      } else if (sortBy === "size") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      } else {
        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
        return 0;
      }
    });
  };

  const filterDocs = (tab) => {
    setActiveTab(tab);
    applyFilters(docs, query, tab);
  };

  // Handle search input change
  const handleSearchChange = (text) => {
    setQuery(text);
    applyFilters(docs, text, activeTab);
  };

  // Handle sort change
  const handleSortChange = (newSortBy, newSortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    applyFilters(docs, query, activeTab);
  };

  // Clear search
  const clearSearch = () => {
    setQuery("");
    applyFilters(docs, "", activeTab);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setQuery("");
    setActiveTab("All");
    setSortBy("name");
    setSortOrder("asc");
    applyFilters(docs, "", "All");
  };

  const toggleFab = () => {
    setFabOpen((prev) => !prev);
  };

  const getCategoryIcon = (cat) => {
    const s = (cat || "").toLowerCase();
    switch (s) {
      case "bank":
        return { name: "card", color: "#F59E0B" };
      case "work":
        return { name: "briefcase", color: "#6366F1" };
      case "personal":
        return { name: "person", color: "#FF6B6B" };
      case "id":
        return { name: "id-card", color: "#06B6D4" };
      case "medical":
        return { name: "medkit", color: "#10B981" };
      case "legal":
        return { name: "gavel", color: "#F97316" };
      case "education":
        return { name: "school", color: "#8B5CF6" };
      case "travel":
        return { name: "airplane", color: "#3B82F6" };
      case "insurance":
        return { name: "shield-checkmark", color: "#06B6D4" };
      default:
        return { name: "albums", color: "#667EEA" };
    }
  };

  const handleSaveDocument = () => {
    setModalVisible(false);
    // Ensure FAB returns to + state after saving
    setFabOpen(false);
    Animated.timing(fabAnim, {
      toValue: 1.0,
      duration: 150,
      useNativeDriver: true,
    }).start();
    loadDocs();
  };

  // Use effect to reapply filters when sort changes
  useEffect(() => {
    if (docs.length > 0) {
      applyFilters(docs, query, activeTab);
    }
  }, [sortBy, sortOrder]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <LinearGradient
        colors={["#667EEA", "#764BA2", "#F093FB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <View style={styles.container}>
          <View style={styles.leftPane}>
            {/* Header */}
            <View style={styles.headerContainer}>
              <LinearGradient
                colors={["#FFFFFF", "#F8FAFC"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
              >
                <View style={styles.headerRow}>
                  <View style={styles.titleSection}>
                    <View style={{ marginRight: 8 }}>
                      <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                      >
                        <Ionicons name="arrow-back" size={18} color="#374151" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.titleTextContainer}>
                      <Text style={styles.headerTitle}>My Documents</Text>
                      <Text style={styles.headerSubtitle}>
                        {filteredDocs.length}{" "}
                        {filteredDocs.length === 1 ? "document" : "documents"}
                      </Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Search */}
            <LinearGradient
              colors={["#FFFFFF", "#F8FAFC"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.searchWrap}
            >
              <View style={styles.searchIconWrap}>
                <Ionicons name="search" size={20} color="#667EEA" />
              </View>
              <TextInput
                placeholder="Search documents..."
                placeholderTextColor="#9CA3AF"
                value={query}
                onChangeText={handleSearchChange}
                style={styles.searchInput}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
              <TouchableOpacity
                style={styles.filterBtn}
                onPress={() => setFilterModalVisible(true)}
              >
                <LinearGradient
                  colors={["#667EEA", "#764BA2"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.filterGradient}
                >
                  <Ionicons name="options" size={18} color="#FFFFFF" />
                  {(sortBy !== "name" || sortOrder !== "asc") && (
                    <View style={styles.filterDot} />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>

            {/* Tabs */}
            <View style={styles.tabsWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabsScrollView}
                contentContainerStyle={styles.tabsContent}
                bounces={true}
                decelerationRate="fast"
              >
                {CATEGORIES.map((t) => {
                  const active = activeTab === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[styles.tabItem, active && styles.tabActive]}
                      onPress={() => filterDocs(t)}
                      activeOpacity={0.8}
                    >
                      {active ? (
                        <LinearGradient
                          colors={["#667EEA", "#764BA2"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.activeTabGradient}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <Ionicons
                              name={getCategoryIcon(t).name}
                              size={14}
                              color={"#FFFFFF"}
                              style={{ marginRight: 6 }}
                            />
                            <Text
                              style={[styles.tabText, styles.tabTextActive]}
                            >
                              {t}
                            </Text>
                          </View>
                        </LinearGradient>
                      ) : (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <Ionicons
                            name={getCategoryIcon(t).name}
                            size={14}
                            color={getCategoryIcon(t).color}
                            style={{ marginRight: 4 }}
                          />
                          <Text style={styles.tabText}>{t}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Cards */}
            <ScrollView
              style={styles.cardsContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.cardsContent}
            >
              <DocCardList data={filteredDocs} />
            </ScrollView>
          </View>

          {/* Floating Action Button */}
          <View style={styles.fabWrap}>
            <Animated.View
              style={[styles.fab, { transform: [{ scale: fabAnim }] }]}
            >
              <TouchableOpacity
                onPress={() => {
                  toggleFab();
                  setModalVisible(true);
                }}
                activeOpacity={0.9}
                accessibilityLabel="Add Document"
              >
                <LinearGradient
                  colors={["#FF6B6B", "#FF9A9E", "#FFD59E"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.fabGradient}
                >
                  <Ionicons
                    name={fabOpen ? "close" : "add"}
                    size={28}
                    color="#FFFFFF"
                  />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* {modal for upload} */}

          <UploadDocModal
            visible={modalVisible}
            onClose={() => {
              // Close the modal and reset FAB to plus
              setModalVisible(false);
              setFabOpen(false);
              Animated.timing(fabAnim, {
                toValue: 1.0,
                duration: 150,
                useNativeDriver: true,
              }).start();
            }}
            onSave={handleSaveDocument}
          />

          <FilterModal
            visible={filterModalVisible}
            onClose={() => setFilterModalVisible(false)}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            onClearFilters={clearAllFilters}
          />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#667EEA",
  },
  gradientBackground: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 25 : 0,
  },
  container: {
    flex: 1,
  },
  leftPane: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingVertical: 0,
    paddingHorizontal: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
  },
  headerContainer: {
    marginBottom: 16,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  titleIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
    shadowColor: "#667EEA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  titleTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: TYPO.headerTitle,
    fontWeight: "900",
    color: "#0F1724",
    letterSpacing: -1,
    marginBottom: 6,
    lineHeight: TYPO.headerTitle * 1.05,
  },
  headerSubtitle: {
    fontSize: TYPO.headerSubtitle,
    fontWeight: "600",
    color: "#475569",
    letterSpacing: 0.2,
    opacity: 0.92,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  lockWrap: {
    backgroundColor: "#ECFDF5",
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D1FAE5",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
    marginLeft: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    marginRight: 6,
  },
  searchWrap: {
    height: 60,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  searchIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(102, 126, 234, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPO.search,
    color: "#0F1724",
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  filterBtn: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  filterGradient: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  filterDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF6B6B",
  },
  tabsWrapper: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  tabsScrollView: {
    flexGrow: 0,
  },
  tabsContent: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabs: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    height: "auto",
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
  },
  tabActive: {
    backgroundColor: "transparent",
  },
  activeTabGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
  },
  tabText: {
    color: "#475569",
    fontSize: TYPO.tab,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  tabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 0,
  },
  cardsContent: {
    paddingBottom: 100,
    flexGrow: 1,
    paddingTop: 4,
  },
  card: {
    width: CARD_SIZE,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardBody: {
    padding: 14,
    paddingTop: 12,
  },
  cardTitle: {
    fontSize: TYPO.cardTitle,
    fontWeight: "800",
    color: "#0F1724",
    marginBottom: 6,
    lineHeight: TYPO.cardTitle * 1.25,
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  tag: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  tagText: {
    color: "#6366F1",
    fontWeight: "600",
    fontSize: 12,
    letterSpacing: 0.2,
  },
  cardMeta: {
    fontSize: TYPO.cardMeta,
    color: "#475569",
    flex: 1,
    textAlign: "right",
    fontWeight: "600",
    opacity: 0.9,
  },

  fabWrap: {
    position: "absolute",
    right: 20,
    bottom: 24,
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 10, // Ensure the FAB is above other components
    elevation: 10, // For Android shadow
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, // For Android shadow
  },
});
