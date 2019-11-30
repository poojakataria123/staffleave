#include<bits/stdc++.h>
#define M 1000000007
#define ll long long
#define pb push_back
#define mp make_pair
#define vi vector<int>
#define vll vector <long long>
#define tests int tc; cin>>tc; while(tc--)
using namespace std;

int main(){
	tests{
		int i,n;
		cin>>n;
		vector <pair<int,int>> a(n);
		for(i=0;i<n;i++)
			cin>>a[i].first>>a[i].second;
		sort(a.begin(), a.end());
		if(a[n-1].first <= a[0].second)
			cout<<"0\n";
		else
			cout<<a[n-1].first - a[0].second<<"\n";
	}
	return 0;
}