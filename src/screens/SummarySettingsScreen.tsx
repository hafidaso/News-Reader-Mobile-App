import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { summaryService, SummarySettings } from '../services/summaryService';

const AI_MODELS = [
  {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast, accurate, cost-effective (Recommended)',
    free: true,
  },
  {
    id: 'openai/gpt-4',
    name: 'GPT-4',
    description: 'Highest quality, slower, more expensive',
    free: false,
  },
  {
    id: 'google/gemini-pro',
    name: 'Gemini Pro',
    description: 'Good quality, free tier available',
    free: true,
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    description: 'Fast and efficient',
    free: false,
  },
];

export const SummarySettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SummarySettings>({
    enabled: false,
    autoGenerate: false,
    model: 'openai/gpt-3.5-turbo',
    apiKey: '',
    maxKeyPoints: 5,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const currentSettings = await summaryService.getSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await summaryService.updateSettings(settings);
      Alert.alert('Success', 'Settings saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!settings.apiKey) {
      Alert.alert('API Key Required', 'Please enter your OpenRouter API key first.');
      return;
    }

    setTestingConnection(true);
    try {
      // Test with a simple article
      const testArticle = {
        title: 'Test Article',
        description: 'This is a test article to verify the API connection is working correctly.',
        url: 'https://test.com',
        urlToImage: null,
        publishedAt: new Date().toISOString(),
        source: { id: 'test', name: 'Test Source' },
        author: 'Test Author',
        content: 'This is a longer test content to ensure the summarization works properly.',
      };

      await summaryService.generateSummaryWithAI(testArticle);
      Alert.alert(
        'Success! ✅',
        'API connection is working perfectly. You can now generate AI-powered summaries!'
      );
    } catch (error: any) {
      Alert.alert(
        'Connection Failed',
        error.message || 'Please check your API key and try again.'
      );
    } finally {
      setTestingConnection(false);
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear All Summaries',
      'This will delete all cached summaries. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await summaryService.clearAllSummaries();
              Alert.alert('Success', 'All summaries cleared!');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear summaries');
            }
          },
        },
      ]
    );
  };

  const getStatistics = async () => {
    const stats = await summaryService.getStatistics();
    Alert.alert(
      'Summary Statistics',
      `Total Summaries: ${stats.totalSummaries}\n` +
      `AI Generated: ${stats.aiGenerated}\n` +
      `Auto-Generated: ${stats.fallbackGenerated}\n` +
      `Average Reading Time: ${stats.averageReadingTime} min`
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading settings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Summary Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Enable/Disable */}
        <View style={styles.sectionHeader}>
          <Ionicons name="sparkles" size={20} color={theme.text} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>AI Summaries</Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="power" size={24} color={theme.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Enable AI Summaries
                </Text>
                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  Use AI to generate article summaries
                </Text>
              </View>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => setSettings({ ...settings, enabled: value })}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="flash" size={24} color={theme.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Auto-Generate
                </Text>
                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  Automatically generate summaries for articles
                </Text>
              </View>
            </View>
            <Switch
              value={settings.autoGenerate}
              onValueChange={(value) => setSettings({ ...settings, autoGenerate: value })}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#fff"
              disabled={!settings.enabled}
            />
          </View>
        </View>

        {/* API Key */}
        <View style={styles.sectionHeader}>
          <Ionicons name="key" size={20} color={theme.text} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>API Configuration</Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.label, { color: theme.text }]}>OpenRouter API Key</Text>
          <Text style={[styles.helpText, { color: theme.textSecondary }]}>
            Get your free API key from https://openrouter.ai/
          </Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
              value={settings.apiKey}
              onChangeText={(text) => setSettings({ ...settings, apiKey: text })}
              placeholder="sk-or-v1-..."
              placeholderTextColor={theme.textSecondary}
              secureTextEntry={!showApiKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowApiKey(!showApiKey)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showApiKey ? 'eye-off' : 'eye'}
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.testButton,
              { backgroundColor: theme.primary },
              (!settings.apiKey || testingConnection) && styles.disabledButton
            ]}
            onPress={handleTestConnection}
            disabled={!settings.apiKey || testingConnection}
            activeOpacity={0.7}
          >
            {testingConnection ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.testButtonText}>Testing...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.testButtonText}>Test Connection</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Model Selection */}
        <View style={styles.sectionHeader}>
          <Ionicons name="options" size={20} color={theme.text} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>AI Model</Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          {AI_MODELS.map((model, index) => (
            <React.Fragment key={model.id}>
              {index > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
              <TouchableOpacity
                style={styles.modelRow}
                onPress={() => setSettings({ ...settings, model: model.id })}
                activeOpacity={0.7}
              >
                <View style={styles.modelLeft}>
                  <View
                    style={[
                      styles.radio,
                      { borderColor: settings.model === model.id ? theme.primary : theme.border },
                    ]}
                  >
                    {settings.model === model.id && (
                      <View style={[styles.radioDot, { backgroundColor: theme.primary }]} />
                    )}
                  </View>
                  <View style={styles.modelInfo}>
                    <View style={styles.modelNameRow}>
                      <Text style={[styles.modelName, { color: theme.text }]}>
                        {model.name}
                      </Text>
                      {model.free && (
                        <View style={[styles.freeBadge, { backgroundColor: theme.success || theme.primary }]}>
                          <Text style={styles.freeBadgeText}>FREE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.modelDescription, { color: theme.textSecondary }]}>
                      {model.description}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        {/* Key Points */}
        <View style={styles.sectionHeader}>
          <Ionicons name="list" size={20} color={theme.text} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Summary Options</Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.label, { color: theme.text }]}>
            Number of Key Points: {settings.maxKeyPoints}
          </Text>
          <Text style={[styles.helpText, { color: theme.textSecondary }]}>
            How many bullet points to extract (1-5)
          </Text>
          
          <View style={styles.sliderContainer}>
            {[1, 2, 3, 4, 5].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.sliderButton,
                  { borderColor: theme.border },
                  settings.maxKeyPoints === num && { 
                    backgroundColor: theme.primary,
                    borderColor: theme.primary 
                  }
                ]}
                onPress={() => setSettings({ ...settings, maxKeyPoints: num })}
              >
                <Text
                  style={[
                    styles.sliderButtonText,
                    { color: settings.maxKeyPoints === num ? '#FFFFFF' : theme.text }
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Management */}
        <View style={styles.sectionHeader}>
          <Ionicons name="settings" size={20} color={theme.text} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Management</Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <TouchableOpacity
            style={styles.managementRow}
            onPress={getStatistics}
            activeOpacity={0.7}
          >
            <Ionicons name="stats-chart" size={24} color={theme.primary} />
            <View style={styles.managementText}>
              <Text style={[styles.managementTitle, { color: theme.text }]}>
                View Statistics
              </Text>
              <Text style={[styles.managementDescription, { color: theme.textSecondary }]}>
                See summary usage stats
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity
            style={styles.managementRow}
            onPress={handleClearCache}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={24} color={theme.error} />
            <View style={styles.managementText}>
              <Text style={[styles.managementTitle, { color: theme.text }]}>
                Clear All Summaries
              </Text>
              <Text style={[styles.managementDescription, { color: theme.textSecondary }]}>
                Delete cached summaries
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={[styles.infoBox, { backgroundColor: theme.card }]}>
          <Ionicons name="information-circle" size={24} color={theme.primary} />
          <View style={styles.infoText}>
            <Text style={[styles.infoTitle, { color: theme.text }]}>How It Works</Text>
            <Text style={[styles.infoDescription, { color: theme.textSecondary }]}>
              • AI summaries require an OpenRouter API key{'\n'}
              • Reading time is calculated automatically{'\n'}
              • Summaries are cached for fast access{'\n'}
              • Fallback mode works without API key
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: theme.primary },
            saving && styles.disabledButton
          ]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.7}
        >
          {saving ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Saving...</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Settings</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 12,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  eyeButton: {
    padding: 10,
    marginLeft: 8,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  modelRow: {
    paddingVertical: 12,
  },
  modelLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modelInfo: {
    flex: 1,
  },
  modelNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  modelName: {
    fontSize: 16,
    fontWeight: '600',
  },
  freeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  freeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  modelDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  sliderContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  sliderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  sliderButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  managementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  managementText: {
    flex: 1,
  },
  managementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  managementDescription: {
    fontSize: 13,
  },
  infoBox: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  infoDescription: {
    fontSize: 13,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 100,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

