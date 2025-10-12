import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';

const ChartWebView = ({ data = [], height = 200, onError = null }) => {
  const webViewRef = useRef(null);

  useEffect(() => {
    if (webViewRef.current) {
      sendDataToChart(data);
    }
  }, [data]);

  const sendDataToChart = (chartData) => {
    if (webViewRef.current) {
      const message = JSON.stringify({
        type: 'chartData',
        scores: chartData,
      });
      webViewRef.current.postMessage(message);
    }
  };

  const handleWebViewLoad = () => {
    // Send initial data after WebView loads
    setTimeout(() => {
      sendDataToChart(data);
    }, 500);
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Message from WebView:', data);
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const handleError = (error) => {
    console.error('WebView error:', error);
    if (onError) {
      onError(error);
    }
  };

  // Get the local HTML file URI
  const getHtmlUri = () => {
    if (Platform.OS === 'ios') {
      return Asset.fromModule(require('../assets/chart.html')).uri;
    } else {
      // For Android, we'll use the file:// protocol
      return 'file:///android_asset/chart.html';
    }
  };

  // HTML content as a fallback for development
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily Summary Chart</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: transparent;
                overflow: hidden;
            }
            
            .chart-container {
                position: relative;
                width: 100%;
                height: 200px;
                padding: 16px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 16px;
                box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
            }
            
            .chart-wrapper {
                position: relative;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 12px;
                padding: 12px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
            
            .chart-title {
                position: absolute;
                top: 8px;
                left: 16px;
                font-size: 14px;
                font-weight: 600;
                color: #374151;
                z-index: 10;
            }
            
            #summaryChart {
                border-radius: 8px;
            }
            
            .no-data {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: #6B7280;
                font-size: 14px;
                font-weight: 500;
            }
            
            .loading {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: #6366F1;
                font-size: 14px;
                font-weight: 500;
            }
            
            .loading::after {
                content: '';
                width: 16px;
                height: 16px;
                margin-left: 8px;
                border: 2px solid #E5E7EB;
                border-radius: 50%;
                border-top-color: #6366F1;
                animation: spin 1s ease-in-out infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    </head>
    <body>
        <div class="chart-container">
            <div class="chart-wrapper">
                <div class="chart-title">Daily Summary Insights</div>
                <div id="loadingState" class="loading">Loading chart...</div>
                <div id="noDataState" class="no-data" style="display: none;">No summary scores yet</div>
                <canvas id="summaryChart" style="display: none;"></canvas>
            </div>
        </div>

        <script>
            let chartInstance = null;
            
            function createGradient(ctx) {
                const gradient = ctx.createLinearGradient(0, 0, 0, 180);
                gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
                gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.15)');
                gradient.addColorStop(1, 'rgba(99, 102, 241, 0.05)');
                return gradient;
            }
            
            function initializeChart(data) {
                const canvas = document.getElementById('summaryChart');
                const ctx = canvas.getContext('2d');
                
                document.getElementById('loadingState').style.display = 'none';
                if (data.length === 0) {
                    document.getElementById('noDataState').style.display = 'flex';
                    canvas.style.display = 'none';
                    return;
                } else {
                    document.getElementById('noDataState').style.display = 'none';
                    canvas.style.display = 'block';
                }
                
                if (chartInstance) {
                    chartInstance.destroy();
                }
                
                const labels = data.map(item => {
                    const date = new Date(item.date);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                });
                
                const scores = data.map(item => item.score || 0);
                
                chartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Daily Score',
                            data: scores,
                            borderColor: '#6366F1',
                            backgroundColor: createGradient(ctx),
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 6,
                            pointHoverRadius: 8,
                            pointBackgroundColor: '#6366F1',
                            pointBorderColor: '#FFFFFF',
                            pointBorderWidth: 2,
                            pointHoverBackgroundColor: '#4F46E5',
                            pointHoverBorderColor: '#FFFFFF',
                            pointHoverBorderWidth: 3,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            intersect: false,
                            mode: 'index',
                        },
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                                titleColor: '#F9FAFB',
                                bodyColor: '#F9FAFB',
                                borderColor: '#6366F1',
                                borderWidth: 1,
                                cornerRadius: 8,
                                displayColors: false,
                                titleFont: {
                                    size: 14,
                                    weight: '600'
                                },
                                bodyFont: {
                                    size: 13
                                },
                                padding: 12,
                                callbacks: {
                                    title: function(context) {
                                        return context[0].label;
                                    },
                                    label: function(context) {
                                        return \`Score: \${context.parsed.y}/10\`;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                grid: {
                                    display: false
                                },
                                ticks: {
                                    color: '#6B7280',
                                    font: {
                                        size: 11,
                                        weight: '500'
                                    },
                                    maxTicksLimit: 7
                                },
                                border: {
                                    display: false
                                }
                            },
                            y: {
                                beginAtZero: true,
                                max: 10,
                                grid: {
                                    color: 'rgba(156, 163, 175, 0.3)',
                                    drawBorder: false
                                },
                                ticks: {
                                    color: '#6B7280',
                                    font: {
                                        size: 11,
                                        weight: '500'
                                    },
                                    stepSize: 2,
                                    callback: function(value) {
                                        return value;
                                    }
                                },
                                border: {
                                    display: false
                                }
                            }
                        },
                        elements: {
                            point: {
                                hoverBorderWidth: 3
                            }
                        },
                        animation: {
                            duration: 1500,
                            easing: 'easeInOutCubic',
                            delay: (context) => {
                                return context.dataIndex * 100;
                            }
                        }
                    }
                });
            }
            
            window.addEventListener('message', function(event) {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'chartData') {
                        initializeChart(data.scores || []);
                    }
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            });
            
            document.addEventListener('message', function(event) {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'chartData') {
                        initializeChart(data.scores || []);
                    }
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            });
            
            setTimeout(() => {
                if (!chartInstance) {
                    initializeChart([]);
                }
            }, 1000);
        </script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webView}
        onLoad={handleWebViewLoad}
        onMessage={handleMessage}
        onError={handleError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={false}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        originWhitelist={['*']}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        // Disable zoom
        injectedJavaScript={`
          const meta = document.createElement('meta');
          meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
          meta.setAttribute('name', 'viewport');
          document.getElementsByTagName('head')[0].appendChild(meta);
        `}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default ChartWebView;