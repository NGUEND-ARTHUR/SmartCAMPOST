import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/providers/parcel_provider.dart';
import 'package:smartcampost_mobile/widgets/common_widgets.dart';

class ParcelListScreen extends StatefulWidget {
  const ParcelListScreen({super.key});

  @override
  State<ParcelListScreen> createState() => _ParcelListScreenState();
}

class _ParcelListScreenState extends State<ParcelListScreen> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    final provider = context.read<ParcelProvider>();
    Future.microtask(() {
      provider.loadMyParcels(refresh: true);
    });
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      final provider = context.read<ParcelProvider>();
      if (!provider.isLoading && provider.hasMore) {
        provider.loadMyParcels();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final parcels = context.watch<ParcelProvider>();
    final tr = context.read<LocaleProvider>().tr;

    return Scaffold(
      appBar: AppBar(title: Text(tr('my_parcels'))),
      body: RefreshIndicator(
        onRefresh: () => parcels.loadMyParcels(refresh: true),
        child: parcels.parcels.isEmpty && !parcels.isLoading
            ? ListView(
                children: [
                  const SizedBox(height: 100),
                  EmptyStateWidget(
                    icon: Icons.inbox_outlined,
                    title: tr('no_parcels'),
                    subtitle: tr('no_parcels_subtitle'),
                    action: ElevatedButton.icon(
                      onPressed: () => Navigator.pushNamed(
                        context,
                        '/client/parcels/create',
                      ),
                      icon: const Icon(Icons.add),
                      label: Text(tr('new_parcel')),
                    ),
                  ),
                ],
              )
            : ListView.builder(
                controller: _scrollController,
                itemCount: parcels.parcels.length + (parcels.isLoading ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index >= parcels.parcels.length) {
                    return const Padding(
                      padding: EdgeInsets.all(16),
                      child: Center(child: CircularProgressIndicator()),
                    );
                  }
                  final p = parcels.parcels[index];
                  return ParcelCard(
                    trackingRef: p.displayRef,
                    status: p.status,
                    senderCity: p.senderCity,
                    recipientCity: p.recipientCity,
                    createdAt: p.createdAt,
                    onTap: () =>
                        Navigator.pushNamed(context, '/client/parcels/${p.id}'),
                  );
                },
              ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.pushNamed(context, '/client/parcels/create'),
        child: const Icon(Icons.add),
      ),
    );
  }
}
