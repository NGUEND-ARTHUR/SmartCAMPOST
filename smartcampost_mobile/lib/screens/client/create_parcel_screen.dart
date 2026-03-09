import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/providers/parcel_provider.dart';
import 'package:smartcampost_mobile/services/services.dart';

class CreateParcelScreen extends StatefulWidget {
  const CreateParcelScreen({super.key});

  @override
  State<CreateParcelScreen> createState() => _CreateParcelScreenState();
}

class _CreateParcelScreenState extends State<CreateParcelScreen> {
  final _formKey = GlobalKey<FormState>();
  final _weightController = TextEditingController();
  final _dimensionsController = TextEditingController();
  final _declaredValueController = TextEditingController();
  final _descriptionController = TextEditingController();

  String _serviceType = 'STANDARD';
  String _deliveryOption = 'AGENCY_PICKUP';
  String _paymentOption = 'PREPAID';
  bool _fragile = false;
  bool _isSubmitting = false;

  String? _senderAddressId;
  String? _recipientAddressId;
  String? _originAgencyId;
  String? _destinationAgencyId;

  List<dynamic> _myAddresses = [];
  List<dynamic> _agencies = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final addressService = AddressService();
      final userService = UserManagementService();
      final addresses = await addressService.getMyAddresses();
      final agencies = await userService.getAgencies();
      if (mounted) {
        setState(() {
          _myAddresses = addresses;
          _agencies = agencies;
        });
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _weightController.dispose();
    _dimensionsController.dispose();
    _declaredValueController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    Position? pos;
    try {
      final permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.always ||
          permission == LocationPermission.whileInUse) {
        pos = await Geolocator.getCurrentPosition();
      }
    } catch (_) {}

    final data = {
      'weight': double.tryParse(_weightController.text),
      'dimensions': _dimensionsController.text.trim(),
      'declaredValue': double.tryParse(_declaredValueController.text),
      'descriptionComment': _descriptionController.text.trim(),
      'serviceType': _serviceType,
      'deliveryOption': _deliveryOption,
      'paymentOption': _paymentOption,
      'fragile': _fragile,
      if (_senderAddressId != null) 'senderAddressId': _senderAddressId,
      if (_recipientAddressId != null)
        'recipientAddressId': _recipientAddressId,
      if (_originAgencyId != null) 'originAgencyId': _originAgencyId,
      if (_destinationAgencyId != null)
        'destinationAgencyId': _destinationAgencyId,
      if (pos != null) 'creationLatitude': pos.latitude,
      if (pos != null) 'creationLongitude': pos.longitude,
    };

    if (!mounted) return;
    final success = await context.read<ParcelProvider>().createParcel(data);

    setState(() => _isSubmitting = false);

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Parcel created successfully!')),
      );
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tr = context.read<LocaleProvider>().tr;
    final parcelProvider = context.watch<ParcelProvider>();

    return Scaffold(
      appBar: AppBar(title: Text(tr('new_parcel'))),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Weight
              TextFormField(
                controller: _weightController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: '${tr('weight')} (kg)',
                  prefixIcon: const Icon(Icons.scale),
                ),
                validator: (v) =>
                    v == null || v.isEmpty ? tr('field_required') : null,
              ),
              const SizedBox(height: 16),

              // Dimensions
              TextFormField(
                controller: _dimensionsController,
                decoration: InputDecoration(
                  labelText: '${tr('dimensions')} (LxWxH cm)',
                  prefixIcon: const Icon(Icons.straighten),
                ),
              ),
              const SizedBox(height: 16),

              // Declared value
              TextFormField(
                controller: _declaredValueController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: '${tr('declared_value')} (XAF)',
                  prefixIcon: const Icon(Icons.attach_money),
                ),
              ),
              const SizedBox(height: 16),

              // Description
              TextFormField(
                controller: _descriptionController,
                maxLines: 3,
                decoration: InputDecoration(
                  labelText: tr('description'),
                  prefixIcon: const Icon(Icons.description),
                  alignLabelWithHint: true,
                ),
              ),
              const SizedBox(height: 16),

              // Service type
              DropdownButtonFormField<String>(
                initialValue: _serviceType,
                decoration: InputDecoration(
                  labelText: tr('service_type'),
                  prefixIcon: const Icon(Icons.local_shipping_outlined),
                ),
                items: const [
                  DropdownMenuItem(value: 'STANDARD', child: Text('Standard')),
                  DropdownMenuItem(value: 'EXPRESS', child: Text('Express')),
                  DropdownMenuItem(value: 'ECONOMY', child: Text('Economy')),
                ],
                onChanged: (v) => setState(() => _serviceType = v!),
              ),
              const SizedBox(height: 16),

              // Delivery option
              DropdownButtonFormField<String>(
                initialValue: _deliveryOption,
                decoration: InputDecoration(
                  labelText: tr('delivery_option'),
                  prefixIcon: const Icon(Icons.delivery_dining),
                ),
                items: const [
                  DropdownMenuItem(
                    value: 'AGENCY_PICKUP',
                    child: Text('Agency Pickup'),
                  ),
                  DropdownMenuItem(
                    value: 'HOME_DELIVERY',
                    child: Text('Home Delivery'),
                  ),
                ],
                onChanged: (v) => setState(() => _deliveryOption = v!),
              ),
              const SizedBox(height: 16),

              // Payment option
              DropdownButtonFormField<String>(
                initialValue: _paymentOption,
                decoration: InputDecoration(
                  labelText: tr('payment_option'),
                  prefixIcon: const Icon(Icons.payment),
                ),
                items: const [
                  DropdownMenuItem(value: 'PREPAID', child: Text('Prepaid')),
                  DropdownMenuItem(
                    value: 'CASH_ON_DELIVERY',
                    child: Text('Cash on Delivery'),
                  ),
                  DropdownMenuItem(
                    value: 'MOBILE_MONEY',
                    child: Text('Mobile Money'),
                  ),
                ],
                onChanged: (v) => setState(() => _paymentOption = v!),
              ),
              const SizedBox(height: 16),

              // Origin agency
              if (_agencies.isNotEmpty)
                DropdownButtonFormField<String>(
                  initialValue: _originAgencyId,
                  decoration: InputDecoration(
                    labelText: tr('origin_agency'),
                    prefixIcon: const Icon(Icons.store),
                  ),
                  items: _agencies
                      .map(
                        (a) => DropdownMenuItem<String>(
                          value: a['id']?.toString(),
                          child: Text(a['name']?.toString() ?? ''),
                        ),
                      )
                      .toList(),
                  onChanged: (v) => setState(() => _originAgencyId = v),
                ),
              if (_agencies.isNotEmpty) const SizedBox(height: 16),

              // Destination agency
              if (_agencies.isNotEmpty)
                DropdownButtonFormField<String>(
                  initialValue: _destinationAgencyId,
                  decoration: InputDecoration(
                    labelText: tr('destination_agency'),
                    prefixIcon: const Icon(Icons.store_mall_directory),
                  ),
                  items: _agencies
                      .map(
                        (a) => DropdownMenuItem<String>(
                          value: a['id']?.toString(),
                          child: Text(a['name']?.toString() ?? ''),
                        ),
                      )
                      .toList(),
                  onChanged: (v) => setState(() => _destinationAgencyId = v),
                ),

              // Sender address
              if (_myAddresses.isNotEmpty) ...[
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  initialValue: _senderAddressId,
                  decoration: InputDecoration(
                    labelText: tr('sender_address'),
                    prefixIcon: const Icon(Icons.home),
                  ),
                  items: _myAddresses
                      .map(
                        (a) => DropdownMenuItem<String>(
                          value: a.id,
                          child: Text(a.displayAddress),
                        ),
                      )
                      .toList(),
                  onChanged: (v) => setState(() => _senderAddressId = v),
                ),
              ],

              // Recipient address
              if (_myAddresses.isNotEmpty) ...[
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  initialValue: _recipientAddressId,
                  decoration: InputDecoration(
                    labelText: tr('recipient_address'),
                    prefixIcon: const Icon(Icons.location_on),
                  ),
                  items: _myAddresses
                      .map(
                        (a) => DropdownMenuItem<String>(
                          value: a.id,
                          child: Text(a.displayAddress),
                        ),
                      )
                      .toList(),
                  onChanged: (v) => setState(() => _recipientAddressId = v),
                ),
              ],

              const SizedBox(height: 16),

              // Fragile
              SwitchListTile(
                title: Text(tr('fragile')),
                subtitle: const Text('Handle with care'),
                value: _fragile,
                onChanged: (v) => setState(() => _fragile = v),
                secondary: const Icon(Icons.warning_amber_rounded),
              ),

              const SizedBox(height: 24),

              // Error
              if (parcelProvider.error != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.red[50],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    parcelProvider.error!,
                    style: TextStyle(color: Colors.red[700]),
                  ),
                ),

              // Submit
              SizedBox(
                height: 50,
                child: ElevatedButton.icon(
                  onPressed: _isSubmitting ? null : _submit,
                  icon: _isSubmitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.send),
                  label: Text(tr('create_parcel')),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
