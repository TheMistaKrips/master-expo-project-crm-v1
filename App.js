import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, RefreshControl, Animated, Easing } from 'react-native';
import { DataTable, Provider as PaperProvider, Appbar, Button, Modal, TextInput, Searchbar, Checkbox } from 'react-native-paper';
import { fetchDataFromGoogleSheets } from './src/api';

const App = () => {
  const [data, setData] = useState([]); // Все данные
  const [filteredData, setFilteredData] = useState([]); // Отфильтрованные данные
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visible, setVisible] = useState(false); // Состояние модального окна для добавления
  const [detailsVisible, setDetailsVisible] = useState(false); // Состояние модального окна для деталей
  const [profitVisible, setProfitVisible] = useState(false); // Состояние модального окна для расчета прибыли
  const [selectedRequest, setSelectedRequest] = useState(null); // Выбранная заявка для деталей
  const [name, setName] = useState(''); // Поле "Имя"
  const [phone, setPhone] = useState(''); // Поле "Телефон"
  const [destination, setDestination] = useState(''); // Поле "Адрес"
  const [whatToDo, setWhatToDo] = useState(''); // Поле "Что надо сделать?"
  const [date, setDate] = useState(''); // Поле "Дата/Время"
  const [searchQuery, setSearchQuery] = useState(''); // Поисковый запрос
  const [totalAmount, setTotalAmount] = useState(''); // Общая сумма
  const [transportCost, setTransportCost] = useState(''); // Транспортный расход
  const [partnerCost, setPartnerCost] = useState(''); // Расход на партнёра
  const [partsCost, setPartsCost] = useState(''); // Расход на запчасти
  const [profitData, setProfitData] = useState(null); // Данные о прибыли
  const fadeAnim = useState(new Animated.Value(0))[0]; // Анимация для модального окна

  // Функция для загрузки данных
  const loadData = async () => {
    setLoading(true);
    const sheetData = await fetchDataFromGoogleSheets();
    // Добавляем ID к данным на стороне приложения
    const dataWithId = sheetData.map((row, index) => ({ ...row, ID: index + 1 }));
    setData(dataWithId);
    setFilteredData(dataWithId); // Инициализируем отфильтрованные данные
    setLoading(false);
    setRefreshing(false);
  };

  // // Загрузка данных при монтировании компонента
  // useEffect(() => {
  //   loadData();

  //   // Установите интервал для автоматического обновления (например, каждые 10 секунд)
  //   const interval = setInterval(loadData, 10000); // 10000 мс = 10 секунд

  //   // Очистка интервала при размонтировании компонента
  //   return () => clearInterval(interval);
  // }, []);

  // Функция для ручного обновления (по свайпу вниз)
  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Функция для отправки данных в Google Sheets
  const addRequest = async () => {
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbxSe1Em70lV3mhb_qhEwlVOI8w2J-wwaA5RijS5LUzEHXusrXzehRi58G92JSdmOQhX/exec'; // Замените на ваш URL
    const payload = {
      action: 'addRequest',
      name,
      phone,
      destination,
      whatToDo,
      date,
    };

    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.text();
      console.log(result); // Успешно добавлено

      // Закрыть модальное окно и обновить данные
      setVisible(false);
      loadData();
    } catch (error) {
      console.error('Ошибка при добавлении данных:', error);
    }
  };

  // Функция для обновления статуса "Выполнено"
  const updateStatus = async (id, status) => {
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbxSe1Em70lV3mhb_qhEwlVOI8w2J-wwaA5RijS5LUzEHXusrXzehRi58G92JSdmOQhX/exec'; // Замените на ваш URL
    const payload = {
      action: 'updateStatus',
      id,
      status,
    };

    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.text();
      console.log(result); // Успешно обновлено
      return result; // Возвращаем результат
    } catch (error) {
      console.error('Ошибка при обновлении статуса:', error);
      throw error; // Пробрасываем ошибку
    }
  };

  // Функция для открытия деталей заявки
  const openDetails = (request) => {
    setSelectedRequest(request);
    setDetailsVisible(true);

    // Анимация появления модального окна
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  };

  // Функция для закрытия деталей заявки
  const closeDetails = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start(() => setDetailsVisible(false));
  };

  // Функция для отметки заявки как выполненной
  const toggleCompleted = async (row) => {
    const newStatus = row.Выполнено === 'Да' ? 'Нет' : 'Да';
    await updateStatus(row.ID, newStatus); // Обновляем статус в Google Sheets

    // Обновляем состояние selectedRequest
    const updatedRequest = { ...row, Выполнено: newStatus };
    setSelectedRequest(updatedRequest);

    // Обновляем данные в таблице
    const updatedData = data.map((item) =>
      item.ID === row.ID ? updatedRequest : item
    );
    setData(updatedData);
    setFilteredData(updatedData);

    // Загружаем данные заново
    loadData();
  };

  // Функция для расчета прибыли
  const calculateProfit = () => {
    const total = parseFloat(totalAmount) || 0;
    const transport = parseFloat(transportCost) || 0;
    const partner = parseFloat(partnerCost) || 0;
    const parts = parseFloat(partsCost) || 0;

    const totalExpenses = transport + partner + parts;
    const netProfit = total - totalExpenses;
    const advertising = netProfit * 0.5; // 50% на рекламу
    const profit = netProfit * 0.5; // 50% на прибыль
    const germanShare = profit / 2; // Доля Германа
    const maximShare = profit / 2; // Доля Максима

    return {
      netProfit,
      advertising,
      germanShare,
      maximShare,
    };
  };

  // Функция для сохранения данных о прибыли в Google Sheets
  const saveProfitData = async () => {
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbxSe1Em70lV3mhb_qhEwlVOI8w2J-wwaA5RijS5LUzEHXusrXzehRi58G92JSdmOQhX/exec'; // Замените на ваш URL
    const payload = {
      action: 'addProfit',
      id: selectedRequest.ID,
      totalAmount,
      transportCost,
      partnerCost,
      partsCost,
      ...calculateProfit(),
    };

    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.text();
      console.log(result); // Успешно добавлено

      // Закрыть модальное окно и обновить данные
      setProfitVisible(false);
      loadData();
    } catch (error) {
      console.error('Ошибка при сохранении данных:', error);
    }
  };

  // Функция для поиска заявок
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query) {
      const filtered = data.filter(
        (item) =>
          item.ID.toString().includes(query) || // Поиск по ID
          item.Имя.toLowerCase().includes(query.toLowerCase()) || // Поиск по имени
          item.Телефон.includes(query) // Поиск по номеру телефона
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data); // Если запрос пустой, показываем все данные
    }
  };

  return (
    <PaperProvider>
      <Appbar.Header>
        <Appbar.Content title="Все заявки" />
      </Appbar.Header>

      {/* Строка поиска */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Поиск по ID, имени или телефону"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {/* Таблица с данными */}
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.container}>
          {loading ? (
            <Text>Загрузка данных...</Text>
          ) : filteredData.length > 0 ? (
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>ID</DataTable.Title>
                <DataTable.Title>Имя</DataTable.Title>
                <DataTable.Title>Телефон</DataTable.Title>
                <DataTable.Title>Адрес</DataTable.Title>
                <DataTable.Title>Что сделать?</DataTable.Title>
                <DataTable.Title>Дата/Время</DataTable.Title>
                <DataTable.Title>Выполнено</DataTable.Title>
              </DataTable.Header>

              {filteredData.map((row, index) => (
                <DataTable.Row key={index} onPress={() => openDetails(row)}>
                  <DataTable.Cell>{row.ID}</DataTable.Cell>
                  <DataTable.Cell>{row.Имя}</DataTable.Cell>
                  <DataTable.Cell>{row.Телефон}</DataTable.Cell>
                  <DataTable.Cell>{row.Адрес}</DataTable.Cell>
                  <DataTable.Cell>{row.ЧтоСделать}</DataTable.Cell>
                  <DataTable.Cell>{row.Дата}</DataTable.Cell>
                  <DataTable.Cell>
                    <Checkbox
                      status={row.Выполнено === 'Да' ? 'checked' : 'unchecked'}
                      onPress={() => toggleCompleted(row)}
                    />
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          ) : (
            <Text>Нет данных, соответствующих запросу.</Text>
          )}
        </View>
      </ScrollView>

      {/* Кнопка добавления */}
      <Button
        mode="contained"
        style={styles.addButton}
        onPress={() => setVisible(true)}
      >
        Добавить заявку
      </Button>

      {/* Модальное окно для добавления заявки */}
      <Modal
        visible={visible}
        onDismiss={() => setVisible(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Text style={styles.modalTitle}>Новая заявка</Text>
        <TextInput
          label="Имя"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <TextInput
          label="Телефон"
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
        />
        <TextInput
          label="Адрес"
          value={destination}
          onChangeText={setDestination}
          style={styles.input}
        />
        <TextInput
          label="Что надо сделать?"
          value={whatToDo}
          onChangeText={setWhatToDo}
          style={styles.input}
        />
        <TextInput
          label="Дата/Время"
          value={date}
          onChangeText={setDate}
          style={styles.input}
        />
        <Button mode="contained" onPress={addRequest}>
          Добавить
        </Button>
      </Modal>

      {/* Модальное окно для деталей заявки */}
      <Modal
        visible={detailsVisible}
        onDismiss={closeDetails}
        contentContainerStyle={styles.modalContainer}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {selectedRequest && (
            <>
              <Text style={styles.modalTitle}>Детали заявки</Text>
              <Text style={styles.detailText}>ID: {selectedRequest.ID}</Text>
              <Text style={styles.detailText}>Имя: {selectedRequest.Имя}</Text>
              <Text style={styles.detailText}>Телефон: {selectedRequest.Телефон}</Text>
              <Text style={styles.detailText}>Адрес: {selectedRequest.Адрес}</Text>
              <Text style={styles.detailText}>Что сделать?: {selectedRequest.ЧтоСделать}</Text>
              <Text style={styles.detailText}>Дата/Время: {selectedRequest.Дата}</Text>
              <View style={styles.checkboxContainer}>
                <Text style={styles.detailText}>Выполнено:</Text>
                <Checkbox
                  status={selectedRequest.Выполнено === 'Да' ? 'checked' : 'unchecked'}
                  onPress={() => toggleCompleted(selectedRequest)}
                />
              </View>

              {selectedRequest.Выполнено === 'Да' && (
                <>
                  <TextInput
                    label="Общая сумма"
                    value={totalAmount}
                    onChangeText={setTotalAmount}
                    style={styles.input}
                    keyboardType="numeric"
                  />
                  <TextInput
                    label="Транспортный расход"
                    value={transportCost}
                    onChangeText={setTransportCost}
                    style={styles.input}
                    keyboardType="numeric"
                  />
                  <TextInput
                    label="Расход на партнёра"
                    value={partnerCost}
                    onChangeText={setPartnerCost}
                    style={styles.input}
                    keyboardType="numeric"
                  />
                  <TextInput
                    label="Расход на запчасти"
                    value={partsCost}
                    onChangeText={setPartsCost}
                    style={styles.input}
                    keyboardType="numeric"
                  />
                  <Button mode="contained" onPress={() => setProfitVisible(true)}>
                    Рассчитать прибыль
                  </Button>
                </>
              )}
            </>
          )}
        </Animated.View>
      </Modal>

      {/* Модальное окно для расчета прибыли */}
      <Modal
        visible={profitVisible}
        onDismiss={() => setProfitVisible(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Text style={styles.modalTitle}>Расчет прибыли</Text>
        {calculateProfit().netProfit > 0 && (
          <>
            <Text style={styles.detailText}>Чистая прибыль: {calculateProfit().netProfit.toFixed(2)} ₽</Text>
            <Text style={styles.detailText}>Реклама: {calculateProfit().advertising.toFixed(2)} ₽</Text>
            <Text style={styles.detailText}>Герман: {calculateProfit().germanShare.toFixed(2)} ₽</Text>
            <Text style={styles.detailText}>Максим: {calculateProfit().maximShare.toFixed(2)} ₽</Text>
            <Button mode="contained" onPress={saveProfitData}>
              Сохранить данные
            </Button>
          </>
        )}
      </Modal>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  addButton: {
    margin: 16,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailText: {
    fontSize: 16,
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  input: {
    marginBottom: 16,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchBar: {
    borderRadius: 8,
  },
});

export default App;