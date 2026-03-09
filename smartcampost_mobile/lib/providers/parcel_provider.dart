import 'package:flutter/material.dart';
import 'package:smartcampost_mobile/models/models.dart';
import 'package:smartcampost_mobile/services/parcel_service.dart';

class ParcelProvider extends ChangeNotifier {
  final ParcelService _parcelService = ParcelService();

  List<Parcel> _parcels = [];
  Parcel? _selectedParcel;
  bool _isLoading = false;
  String? _error;
  int _currentPage = 0;
  int _totalPages = 0;
  bool _hasMore = true;

  List<Parcel> get parcels => _parcels;
  Parcel? get selectedParcel => _selectedParcel;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get currentPage => _currentPage;
  int get totalPages => _totalPages;
  bool get hasMore => _hasMore;

  Future<void> loadMyParcels({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 0;
      _parcels = [];
    }
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final response = await _parcelService.getMyParcels(page: _currentPage);
      if (refresh) {
        _parcels = response.content;
      } else {
        _parcels.addAll(response.content);
      }
      _totalPages = response.totalPages;
      _hasMore = response.hasNextPage;
      _currentPage++;
    } catch (e) {
      _error = e.toString();
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadAllParcels({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 0;
      _parcels = [];
    }
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final response = await _parcelService.getParcels(page: _currentPage);
      if (refresh) {
        _parcels = response.content;
      } else {
        _parcels.addAll(response.content);
      }
      _totalPages = response.totalPages;
      _hasMore = response.hasNextPage;
      _currentPage++;
    } catch (e) {
      _error = e.toString();
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadParcelDetail(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      _selectedParcel = await _parcelService.getParcelById(id);
    } catch (e) {
      _error = e.toString();
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<Parcel?> trackParcel(String trackingRef) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final parcel = await _parcelService.trackParcel(trackingRef);
      _selectedParcel = parcel;
      _isLoading = false;
      notifyListeners();
      return parcel;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  Future<bool> createParcel(Map<String, dynamic> data) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final parcel = await _parcelService.createParcel(data);
      _parcels.insert(0, parcel);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateStatus(
    String id, {
    required String status,
    double? latitude,
    double? longitude,
    String? comment,
  }) async {
    try {
      final updated = await _parcelService.updateParcelStatus(
        id,
        status: status,
        latitude: latitude,
        longitude: longitude,
        comment: comment,
      );
      final index = _parcels.indexWhere((p) => p.id == id);
      if (index >= 0) _parcels[index] = updated;
      if (_selectedParcel?.id == id) _selectedParcel = updated;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  void clearSelection() {
    _selectedParcel = null;
    notifyListeners();
  }
}
